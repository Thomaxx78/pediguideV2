import { Router, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '../db';
import {
  patientSessions,
  diagnosis,
  formTemplates,
  children,
  doctors,
  DEFAULT_QUESTIONS,
  diagnosis_question_proposition_table,
  diagnosis_question_table,
  response_table,
  response_to_question_table,
  type Question,
  type QuestionType,
} from '../db/schema';
import { authenticateToken, type AuthRequest } from '../middleware/auth.middleware';
import { sendFormLinkEmail } from '../lib/email';
import { computeTriageScore } from '../services/triage.service';

export const sessionsRouter = Router();

type DbQuestionType = 'short' | 'long' | 'radio' | 'checkbox' | 'date' | 'symptom_picker' | 'symptom_timeline' | 'allergy_picker' | 'antecedent_picker' | 'scale';

const toDbQuestionType = (type: QuestionType): DbQuestionType => {
  if (type === 'textarea') return 'long';
  if (type === 'single_choice') return 'radio';
  if (type === 'multiple_choice') return 'checkbox';
  const richTypes = ['date', 'symptom_picker', 'symptom_timeline', 'allergy_picker', 'antecedent_picker', 'scale'] as const;
  if ((richTypes as readonly string[]).includes(type)) return type as DbQuestionType;
  return 'short';
};

const toClientQuestionType = (type: DbQuestionType): QuestionType => {
  if (type === 'long') return 'textarea';
  if (type === 'radio') return 'single_choice';
  if (type === 'checkbox') return 'multiple_choice';
  if (type === 'short') return 'text';
  // Rich types and 'date' pass through
  return type as QuestionType;
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

const loadTemplateQuestions = async (formTemplateId: string | null): Promise<Question[]> => {
  if (!formTemplateId) return DEFAULT_QUESTIONS;

  const [template] = await db.select({ questions: formTemplates.questions })
    .from(formTemplates)
    .where(eq(formTemplates.id, formTemplateId))
    .limit(1);
  const rawQuestions = (template?.questions?.length ? template.questions : DEFAULT_QUESTIONS) as Question[];
  // Return ALL questions including step_breaks — step_breaks are used for frontend step structure
  // They are filtered out before any DB insert (see ensureSessionResponse)
  return rawQuestions.map(q => normalizeQuestion(q));
};

type SessionQuestion = Question & {
  propositions?: Array<{ id: string; value: string }>;
};

const loadPersistedSessionQuestions = async (diagnosisId: string): Promise<SessionQuestion[]> => {
  const [record] = await db.query.diagnosis.findMany({
    where: eq(diagnosis.id, diagnosisId),
    with: {
      questions: {
        with: {
          propositions: true,
        },
      },
    },
    limit: 1,
  });

  return (record?.questions ?? []).map((question) => {
    const propositions = question.propositions?.map((proposition) => ({
      id: proposition.id,
      value: proposition.proposition,
    })) ?? [];

    return {
      id: question.id,
      type: /date|naissance/i.test(question.question)
        ? 'date'
        : toClientQuestionType(question.type as DbQuestionType),
      label: question.question,
      required: Boolean(question.required),
      options: propositions.map((proposition) => proposition.value),
      propositions,
    };
  });
};

// Re-inserts step_break entries (from the template) into the list of persisted DB questions.
// DB only contains real questions (step_breaks are never persisted).
// Walk the template in order: emit step_breaks as-is, consume dbQs one by one for real questions.
const mergeStepBreaks = (templateQs: Question[], dbQs: SessionQuestion[]): SessionQuestion[] => {
  const result: SessionQuestion[] = [];
  let dbIdx = 0;
  for (const tq of templateQs) {
    if (tq.type === 'step_break') {
      result.push({ id: tq.id, type: 'step_break', label: tq.label, required: false, options: [] });
    } else if (dbIdx < dbQs.length) {
      result.push(dbQs[dbIdx++]);
    }
  }
  return result;
};

const ensureSessionResponse = async (
  session: {
    id: string;
    doctorId: string;
    formTemplateId: string | null;
  },
): Promise<{ diagnosisId: string; responseId: string; questions: SessionQuestion[] }> => {
  // Load ALL template questions including step_breaks (for step structure)
  const allTemplateQuestions = await loadTemplateQuestions(session.formTemplateId);
  // Only non-step_break questions go into the DB
  const dbTemplateQuestions = allTemplateQuestions.filter(q => q.type !== 'step_break');

  const [existingDiagnosis] = await db.select({ id: diagnosis.id })
    .from(diagnosis)
    .where(and(eq(diagnosis.sessionId, session.id), eq(diagnosis.status, 'pending_response')))
    .limit(1);

  if (existingDiagnosis) {
    let [existingResponse] = await db.select({ id: response_table.id })
      .from(response_table)
      .where(eq(response_table.diagnosis_id, existingDiagnosis.id))
      .limit(1);

    if (!existingResponse) {
      [existingResponse] = await db.insert(response_table).values({
        diagnosis_id: existingDiagnosis.id,
      }).returning({ id: response_table.id });
    }

    const dbQs = await loadPersistedSessionQuestions(existingDiagnosis.id);
    // dbQs may have extra rows if session was created with old code that stored step_breaks.
    // Trim to expected count to stay aligned with template positions.
    const trimmedDbQs = dbQs.slice(0, dbTemplateQuestions.length);

    return {
      diagnosisId: existingDiagnosis.id,
      responseId: existingResponse.id,
      questions: mergeStepBreaks(allTemplateQuestions, trimmedDbQs),
    };
  }

  const created = await db.transaction(async (tx) => {
    const [createdDiagnosis] = await tx.insert(diagnosis).values({
      doctorId: session.doctorId,
      sessionId: session.id,
      formTemplateId: session.formTemplateId,
      status: 'pending_response',
    }).returning({ id: diagnosis.id });

    // Insert only real questions — step_breaks are frontend-only
    const normalizedQuestions = dbTemplateQuestions.map(normalizeQuestion);
    const createdQuestions = normalizedQuestions.length
      ? await tx.insert(diagnosis_question_table).values(
        normalizedQuestions.map((question) => ({
          diagnosis_id: createdDiagnosis.id,
          question: question.label,
          description: null,
          type: toDbQuestionType(question.type),
          required: question.required,
        })),
      ).returning()
      : [];

    const propositionRows = normalizedQuestions.flatMap((question, questionIndex) => {
      const createdQuestion = createdQuestions[questionIndex];
      if (!createdQuestion) return [];

      return (question.options ?? []).map((option) => ({
        diagnosis_id: createdDiagnosis.id,
        question_id: createdQuestion.id,
        proposition: option,
      }));
    });

    if (propositionRows.length) {
      await tx.insert(diagnosis_question_proposition_table).values(propositionRows);
    }

    const [createdResponse] = await tx.insert(response_table).values({
      diagnosis_id: createdDiagnosis.id,
    }).returning({ id: response_table.id });

    return {
      diagnosisId: createdDiagnosis.id,
      responseId: createdResponse.id,
    };
  });

  const dbQs = await loadPersistedSessionQuestions(created.diagnosisId);
  return {
    ...created,
    questions: mergeStepBreaks(allTemplateQuestions, dbQs),
  };
};

const getAnswerByLabel = (
  answers: Record<string, string | string[]>,
  questions: Question[],
  labelPattern: RegExp,
) => {
  const question = questions.find((q) => labelPattern.test(q.label));
  const value = question ? answers[question.id] : undefined;
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
};

const getArrayAnswerByLabel = (
  answers: Record<string, string | string[]>,
  questions: Question[],
  labelPattern: RegExp,
) => {
  const question = questions.find((q) => labelPattern.test(q.label));
  const value = question ? answers[question.id] : undefined;
  return Array.isArray(value) ? value : value ? [value] : [];
};

const persistNormalizedResponse = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  diagnosisId: string,
  questions: Question[],
  answers: Record<string, string | string[]>,
) => {
  const normalizedQuestions = questions.map(normalizeQuestion);
  if (!normalizedQuestions.length) return;

  const createdQuestions = await tx.insert(diagnosis_question_table).values(
    normalizedQuestions.map((question) => ({
      diagnosis_id: diagnosisId,
      question: question.label,
      description: null,
      type: toDbQuestionType(question.type),
      required: question.required,
    })),
  ).returning();

  const propositions = normalizedQuestions.flatMap((question, questionIndex) => {
    const createdQuestion = createdQuestions[questionIndex];
    if (!createdQuestion) return [];
    return (question.options ?? []).map((option) => ({
      diagnosis_id: diagnosisId,
      question_id: createdQuestion.id,
      proposition: option,
    }));
  });

  const createdPropositions = propositions.length
    ? await tx.insert(diagnosis_question_proposition_table).values(propositions).returning()
    : [];

  const propositionsByQuestionAndValue = new Map<string, string>();
  for (const proposition of createdPropositions) {
    propositionsByQuestionAndValue.set(`${proposition.question_id}:${proposition.proposition}`, proposition.id);
  }

  const [response] = await tx.insert(response_table).values({
    diagnosis_id: diagnosisId,
    answeredAt: new Date(),
  }).returning({ id: response_table.id });

  const responseRows = normalizedQuestions.flatMap((question, questionIndex) => {
    const createdQuestion = createdQuestions[questionIndex];
    if (!createdQuestion) return [];

    const rawValue = answers[question.id];
    const values = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
    return values.map((value) => ({
      response_id: response.id,
      question_id: createdQuestion.id,
      proposition_id: propositionsByQuestionAndValue.get(`${createdQuestion.id}:${value}`) ?? null,
      value,
    }));
  });

  if (responseRows.length) {
    await tx.insert(response_to_question_table).values(responseRows);
  }
};

// POST /api/sessions — créer une session patient (auth médecin)
sessionsRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ error: 'Non authentifié' });

    const { patientEmail, patientFirstName, formTemplateId, appointmentAt } = req.body;

    let appointmentDate: Date | null = null;
    if (appointmentAt) {
      const parsed = new Date(appointmentAt);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Date de rendez-vous invalide' });
      }
      if (parsed.getTime() <= Date.now()) {
        return res.status(400).json({ error: 'La date de rendez-vous doit être dans le futur' });
      }
      appointmentDate = parsed;
    }

    if (patientEmail && !appointmentDate) {
      return res.status(400).json({
        error: 'La date de rendez-vous est obligatoire dès qu\'un email patient est renseigné (sinon les relances ne peuvent pas être envoyées).',
      });
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const [session] = await db.insert(patientSessions).values({
      doctorId,
      patientToken: token,
      patientEmail: patientEmail || null,
      patientFirstName: patientFirstName || null,
      formTemplateId: formTemplateId || null,
      expiresAt,
      appointmentAt: appointmentDate,
    }).returning();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const formUrl = `${baseUrl}/pre-consultation/${token}`;

    res.json({ session, formUrl });
  } catch (error: any) {
    console.error('❌ [Sessions] Erreur création:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sessions — liste des sessions du médecin connecté
sessionsRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ error: 'Non authentifié' });

    const sessions = await db.select().from(patientSessions)
      .where(eq(patientSessions.doctorId, doctorId))
      .orderBy(patientSessions.createdAt);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const result = sessions.map(s => ({
      ...s,
      formUrl: `${baseUrl}/form/${s.patientToken}`,
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sessions/:token — infos session pour le patient (public)
sessionsRouter.get('/:token', async (req, res: Response): Promise<any> => {
  try {
    const token = String(req.params.token || '');
    const [row] = await db.select({
      id: patientSessions.id,
      doctorId: patientSessions.doctorId,
      status: patientSessions.status,
      expiresAt: patientSessions.expiresAt,
      patientFirstName: patientSessions.patientFirstName,
      formTemplateId: patientSessions.formTemplateId,
      appointmentAt: patientSessions.appointmentAt,
      doctorFirstName: doctors.firstName,
      doctorLastName: doctors.lastName,
    }).from(patientSessions)
      .leftJoin(doctors, eq(patientSessions.doctorId, doctors.id))
      .where(eq(patientSessions.patientToken, token)).limit(1);

    if (!row) return res.status(404).json({ error: 'Lien introuvable' });
    if (new Date() > new Date(row.expiresAt)) {
      return res.status(410).json({ error: 'Ce lien a expiré' });
    }
    if (row.status === 'completed') {
      return res.status(409).json({ error: 'Ce formulaire a déjà été rempli' });
    }

    const response = await ensureSessionResponse(row);

    res.json({
      ...row,
      diagnosisId: response.diagnosisId,
      responseId: response.responseId,
      questions: response.questions,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/sessions/:token/respond — soumission du formulaire patient (public)
sessionsRouter.post('/:token/respond', async (req, res: Response): Promise<any> => {
  try {
    const token = String(req.params.token || '');
    const [session] = await db.select().from(patientSessions)
      .where(eq(patientSessions.patientToken, token)).limit(1);

    if (!session) return res.status(404).json({ error: 'Lien introuvable' });
    if (new Date() > new Date(session.expiresAt)) return res.status(410).json({ error: 'Lien expiré' });
    if (session.status === 'completed') return res.status(409).json({ error: 'Déjà soumis' });

    const data = req.body;
    const questions = (await loadTemplateQuestions(session.formTemplateId)).filter(q => q.type !== 'step_break');
    const answers = (data.answers ?? {}) as Record<string, string | string[]>;
    const nir: string | null = data.nir?.trim() || null;

    // Matching NIR : cherche ou crée le dossier enfant
    let childId: string | null = null;
    if (nir) {
      const firstName = (data.childFirstName || getAnswerByLabel(answers, questions, /prénom/i) || '').trim();
      const lastName = (data.childLastName || getAnswerByLabel(answers, questions, /nom/i) || '').trim();
      const birthDate = (data.childBirthDate || getAnswerByLabel(answers, questions, /naissance/i) || '').trim();

      const [existing] = await db.select({ id: children.id })
        .from(children)
        .where(and(eq(children.nir, nir), eq(children.doctorId, session.doctorId)))
        .limit(1);

      if (existing) {
        childId = existing.id;
      } else if (firstName && lastName && birthDate) {
        const [created] = await db.insert(children).values({
          doctorId: session.doctorId,
          nir,
          firstName,
          lastName,
          birthDate,
        }).returning({ id: children.id });
        childId = created.id;
      }
    }

    const isCustom = !!session.formTemplateId;
    // Build labeled answers keyed by question label (for display in doctor dashboard)
    let labeledCustomAnswers: Record<string, string | string[]> | null = null;
    if (isCustom) {
      labeledCustomAnswers = {};
      for (const q of questions) {
        if (answers[q.id] !== undefined) {
          labeledCustomAnswers[q.label] = answers[q.id];
        }
      }
    }

    const childBirthDate = data.childBirthDate || getAnswerByLabel(answers, questions, /naissance/i) || 'N/A';
    const triage = computeTriageScore({
      clinicalSigns: (data.clinicalSigns || getArrayAnswerByLabel(answers, questions, /signes cliniques/i)) as string[],
      behaviorChanges: (data.behaviorChanges || getArrayAnswerByLabel(answers, questions, /comportement/i)) as string[],
      worryLevel: data.worryLevel || getAnswerByLabel(answers, questions, /inquiétude/i),
      duration: data.duration || getAnswerByLabel(answers, questions, /combien de temps|durée|depuis/i),
      childBirthDate,
    });

    const record = await db.transaction(async (tx) => {
      const [createdDiagnosis] = await tx.insert(diagnosis).values({
        childFirstName: data.childFirstName || getAnswerByLabel(answers, questions, /prénom/i) || session.patientFirstName || null,
        childLastName: data.childLastName || getAnswerByLabel(answers, questions, /nom/i) || null,
        childBirthDate,
        consultationReason: data.consultationReason || getAnswerByLabel(answers, questions, /motif/i) || null,
        behaviorChanges: (data.behaviorChanges || getArrayAnswerByLabel(answers, questions, /comportement/i)) as string[],
        clinicalSigns: (data.clinicalSigns || getArrayAnswerByLabel(answers, questions, /signes cliniques/i)) as string[],
        duration: data.duration || getAnswerByLabel(answers, questions, /combien de temps|durée|depuis/i) || null,
        worryLevel: data.worryLevel || getAnswerByLabel(answers, questions, /inquiétude/i) || null,
        actionsTaken: (data.actionsTaken || getArrayAnswerByLabel(answers, questions, /actions/i)) as string[],
        additionalNotes: data.additionalNotes || getAnswerByLabel(answers, questions, /complémentaires|message libre/i) || '',

        weight: data.weight ?? null,
        height: data.height ?? null,
        gender: data.gender ?? null,
        symptoms: (data.symptoms ?? []) as string[],
        symptomOther: data.symptomOther ?? null,
        symptomTimeline: data.symptomTimeline ?? {},
        symptomSeverity: data.symptomSeverity ?? {},
        allergies: (data.allergies ?? []) as string[],
        noAllergies: data.noAllergies ?? false,
        treatments: data.treatments ?? null,
        antecedents: (data.antecedents ?? []) as string[],
        noAntecedents: data.noAntecedents ?? false,
        vaccinations: data.vaccinations ?? null,
        worry: data.worry ?? null,
        photoName: data.photoName ?? null,

        doctorId: session.doctorId,
        sessionId: session.id,
        formTemplateId: session.formTemplateId || null,
        customAnswers: isCustom ? (labeledCustomAnswers ?? answers) : null,
        childId,
        nir,
        triageLevel: triage.level,
        triageScore: String(triage.score),
      }).returning({ id: diagnosis.id });

      await persistNormalizedResponse(tx, createdDiagnosis.id, questions, answers);

      await tx.update(patientSessions)
        .set({ status: 'completed' })
        .where(eq(patientSessions.id, session.id));

      return createdDiagnosis;
    });

    res.json({ success: true, id: record.id });
  } catch (error: any) {
    console.error('❌ [Sessions] Erreur soumission:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/sessions/:id/send-email — envoyer le lien par email (auth médecin)
sessionsRouter.post('/:id/send-email', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user?.id;
    const id = String(req.params.id || '');

    const [session] = await db.select().from(patientSessions)
      .where(and(eq(patientSessions.id, id), eq(patientSessions.doctorId, doctorId!))).limit(1);

    if (!session) return res.status(404).json({ error: 'Session introuvable' });
    if (!session.patientEmail) return res.status(400).json({ error: 'Pas d\'email patient configuré' });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const formUrl = `${baseUrl}/form/${session.patientToken}`;

    await sendFormLinkEmail({
      to: session.patientEmail,
      patientFirstName: session.patientFirstName,
      formUrl,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ [Sessions] Erreur envoi email:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
  }
});
