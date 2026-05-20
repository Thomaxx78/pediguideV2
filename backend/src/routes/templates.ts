import { Router, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { formTemplates, DEFAULT_QUESTIONS, type Question } from '../db/schema';
import { authenticateToken, type AuthRequest } from '../middleware/auth.middleware';

export const templatesRouter = Router();

// GET /api/templates — liste des templates du médecin
templatesRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user!.id;
    const list = await db.select().from(formTemplates)
      .where(eq(formTemplates.doctorId, doctorId))
      .orderBy(formTemplates.createdAt);
    res.json(list);
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
    res.json(template);
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

    const resolvedQuestions: Question[] = startFromDefault
      ? DEFAULT_QUESTIONS.map(q => ({ ...q, id: randomUUID() }))
      : (questions ?? []);

    const [template] = await db.insert(formTemplates).values({
      doctorId,
      title: title.trim(),
      description: description?.trim() || null,
      questions: resolvedQuestions,
    }).returning();

    res.status(201).json(template);
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

    const [updated] = await db.update(formTemplates)
      .set({
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(questions !== undefined && { questions }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(formTemplates.id, String(req.params.id || '')))
      .returning();

    res.json(updated);
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

    await db.delete(formTemplates).where(eq(formTemplates.id, String(req.params.id || '')));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
