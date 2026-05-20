import { Router, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '../db';
import {
  diagnosis,
  diagnosis_question_proposition_table,
  diagnosis_question_table,
  formTemplates,
  patientSessions,
  DEFAULT_QUESTIONS,
  type Question,
  type QuestionType,
} from '../db/schema';
import { authenticateToken, type AuthRequest } from '../middleware/auth.middleware';

export const templatesRouter = Router();

type DbQuestionType = 'short' | 'long' | 'radio' | 'checkbox';

const toDbQuestionType = (type: QuestionType): DbQuestionType => {
  if (type === 'textarea') return 'long';
  if (type === 'single_choice') return 'radio';
  if (type === 'multiple_choice') return 'checkbox';
  return 'short';
};

const toClientQuestionType = (type: DbQuestionType): QuestionType => {
  if (type === 'long') return 'textarea';
  if (type === 'radio') return 'single_choice';
  if (type === 'checkbox') return 'multiple_choice';
  return 'text';
};

const normalizeQuestion = (question: Question): Question => ({
  id: question.id || randomUUID(),
  type: question.type,
  label: question.label?.trim() || 'Question sans titre',
  required: Boolean(question.required),
  options: question.type === 'single_choice' || question.type === 'multiple_choice'
    ? (question.options ?? []).map((option) => String(option).trim()).filter(Boolean)
    : undefined,
});

const loadNormalizedQuestions = async (
  formTemplateId: string,
  fallbackQuestions: Question[] = [],
): Promise<Question[] | null> => {
  const [templateDiagnosis] = await db.query.diagnosis.findMany({
    where: and(eq(diagnosis.formTemplateId, formTemplateId), eq(diagnosis.status, 'template')),
    with: {
      questions: {
        with: {
          propositions: true,
        },
      },
    },
    limit: 1,
  });

  if (!templateDiagnosis?.questions?.length) return null;

  return templateDiagnosis.questions.map((question, index) => ({
    id: question.id,
    type: fallbackQuestions[index]?.type ?? toClientQuestionType(question.type as DbQuestionType),
    label: question.question,
    required: Boolean(question.required),
    options: question.propositions?.map((proposition) => proposition.proposition) ?? [],
  }));
};

const syncNormalizedTemplate = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  doctorId: string,
  formTemplateId: string,
  questions: Question[],
) => {
  let [templateDiagnosis] = await tx.select({ id: diagnosis.id })
    .from(diagnosis)
    .where(and(eq(diagnosis.doctorId, doctorId), eq(diagnosis.formTemplateId, formTemplateId)))
    .limit(1);

  if (!templateDiagnosis) {
    [templateDiagnosis] = await tx.insert(diagnosis).values({
      doctorId,
      formTemplateId,
      status: 'template',
    }).returning({ id: diagnosis.id });
  }

  await tx.delete(diagnosis_question_proposition_table)
    .where(eq(diagnosis_question_proposition_table.diagnosis_id, templateDiagnosis.id));
  await tx.delete(diagnosis_question_table)
    .where(eq(diagnosis_question_table.diagnosis_id, templateDiagnosis.id));

  const normalizedQuestions = questions.map(normalizeQuestion);
  if (!normalizedQuestions.length) return;

  const createdQuestions = await tx.insert(diagnosis_question_table).values(
    normalizedQuestions.map((question) => ({
      diagnosis_id: templateDiagnosis.id,
      question: question.label,
      description: null,
      type: toDbQuestionType(question.type),
      required: question.required,
    })),
  ).returning();

  const propositions = normalizedQuestions.flatMap((question, index) => {
    const createdQuestion = createdQuestions[index];
    if (!createdQuestion) return [];

    return (question.options ?? []).map((option) => ({
      diagnosis_id: templateDiagnosis.id,
      question_id: createdQuestion.id,
      proposition: option,
    }));
  });

  if (propositions.length) {
    await tx.insert(diagnosis_question_proposition_table).values(propositions);
  }
};

const withNormalizedQuestions = async <T extends { id: string; questions: Question[] }>(template: T) => {
  const normalizedQuestions = await loadNormalizedQuestions(template.id, template.questions);
  return {
    ...template,
    questions: normalizedQuestions ?? template.questions,
  };
};

// GET /api/templates — liste des templates du médecin
templatesRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user!.id;
    const list = await db.select().from(formTemplates)
      .where(eq(formTemplates.doctorId, doctorId))
      .orderBy(formTemplates.createdAt);
    res.json(await Promise.all(list.map(withNormalizedQuestions)));
  } catch (e: any) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/templates/:id — détail d'un template
templatesRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user!.id;
    const [template] = await db.select().from(formTemplates)
      .where(and(eq(formTemplates.id, String(req.params.id || '')), eq(formTemplates.doctorId, doctorId)))
      .limit(1);
    if (!template) return res.status(404).json({ error: 'Template introuvable' });
    res.json(await withNormalizedQuestions(template));
  } catch (e: any) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/templates — créer un template
templatesRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user!.id;
    const { title, description, questions, startFromDefault } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });

    const resolvedQuestions: Question[] = (startFromDefault
      ? DEFAULT_QUESTIONS.map(q => ({ ...q, id: randomUUID() }))
      : (questions ?? [])).map(normalizeQuestion);

    const template = await db.transaction(async (tx) => {
      const [created] = await tx.insert(formTemplates).values({
        doctorId,
        title: title.trim(),
        description: description?.trim() || null,
        questions: resolvedQuestions,
      }).returning();

      await syncNormalizedTemplate(tx, doctorId, created.id, resolvedQuestions);
      return created;
    });

    res.status(201).json(await withNormalizedQuestions(template));
  } catch (e: any) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/templates/:id — modifier un template
templatesRouter.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user!.id;
    const { title, description, questions, isActive } = req.body;

    const [existing] = await db.select({ id: formTemplates.id })
      .from(formTemplates)
      .where(and(eq(formTemplates.id, String(req.params.id || '')), eq(formTemplates.doctorId, doctorId)))
      .limit(1);

    if (!existing) return res.status(404).json({ error: 'Template introuvable' });

    const templateId = String(req.params.id || '');
    const normalizedQuestions = questions !== undefined
      ? (questions as Question[]).map(normalizeQuestion)
      : undefined;

    const updated = await db.transaction(async (tx) => {
      const [result] = await tx.update(formTemplates)
        .set({
          ...(title !== undefined && { title: title.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(normalizedQuestions !== undefined && { questions: normalizedQuestions }),
          ...(isActive !== undefined && { isActive }),
          updatedAt: new Date(),
        })
        .where(eq(formTemplates.id, templateId))
        .returning();

      if (normalizedQuestions !== undefined) {
        await syncNormalizedTemplate(tx, doctorId, templateId, normalizedQuestions);
      }

      return result;
    });

    res.json(await withNormalizedQuestions(updated));
  } catch (e: any) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/templates/:id — supprimer un template
templatesRouter.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user!.id;
    const [existing] = await db.select({ id: formTemplates.id })
      .from(formTemplates)
      .where(and(eq(formTemplates.id, String(req.params.id || '')), eq(formTemplates.doctorId, doctorId)))
      .limit(1);

    if (!existing) return res.status(404).json({ error: 'Template introuvable' });

    const templateId = String(req.params.id || '');
    const templateForms = await db.select({ id: diagnosis.id })
      .from(diagnosis)
      .where(and(eq(diagnosis.formTemplateId, templateId), eq(diagnosis.status, 'template')));

    await db.transaction(async (tx) => {
      for (const form of templateForms) {
        await tx.delete(diagnosis_question_proposition_table)
          .where(eq(diagnosis_question_proposition_table.diagnosis_id, form.id));
        await tx.delete(diagnosis_question_table)
          .where(eq(diagnosis_question_table.diagnosis_id, form.id));
        await tx.delete(diagnosis).where(eq(diagnosis.id, form.id));
      }

      await tx.update(patientSessions)
        .set({ formTemplateId: null })
        .where(eq(patientSessions.formTemplateId, templateId));
      await tx.update(diagnosis)
        .set({ formTemplateId: null })
        .where(eq(diagnosis.formTemplateId, templateId));
      await tx.delete(formTemplates).where(eq(formTemplates.id, templateId));
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
