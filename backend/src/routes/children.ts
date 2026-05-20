import { Router, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { children, diagnosis } from '../db/schema';
import { authenticateToken, type AuthRequest } from '../middleware/auth.middleware';

export const childrenRouter = Router();

// GET /api/children — liste les dossiers enfants du médecin connecté
childrenRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ error: 'Non authentifié' });

    const records = await db.select().from(children)
      .where(eq(children.doctorId, doctorId))
      .orderBy(desc(children.createdAt));

    // Pour chaque enfant, récupérer le nombre de consultations et la date de la dernière
    const result = await Promise.all(records.map(async (child) => {
      const consultations = await db.select({
        id: diagnosis.id,
        createdAt: diagnosis.createdAt,
      }).from(diagnosis)
        .where(eq(diagnosis.childId, child.id))
        .orderBy(desc(diagnosis.createdAt));

      return {
        ...child,
        consultationCount: consultations.length,
        lastConsultationAt: consultations[0]?.createdAt ?? null,
      };
    }));

    res.json(result);
  } catch (error: any) {
    console.error('❌ [Children] Erreur liste:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/children/:id — dossier complet d'un enfant + tendance IA
childrenRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ error: 'Non authentifié' });

    const id = String(req.params.id || '');

    const [child] = await db.select().from(children)
      .where(and(eq(children.id, id), eq(children.doctorId, doctorId)))
      .limit(1);

    if (!child) return res.status(404).json({ error: 'Dossier introuvable' });

    const consultations = await db.select({
      id: diagnosis.id,
      createdAt: diagnosis.createdAt,
      consultationReason: diagnosis.consultationReason,
      worryLevel: diagnosis.worryLevel,
      duration: diagnosis.duration,
      clinicalSigns: diagnosis.clinicalSigns,
      behaviorChanges: diagnosis.behaviorChanges,
      actionsTaken: diagnosis.actionsTaken,
      additionalNotes: diagnosis.additionalNotes,
      aiSynthesis: diagnosis.aiSynthesis,
      status: diagnosis.status,
    }).from(diagnosis)
      .where(eq(diagnosis.childId, child.id))
      .orderBy(desc(diagnosis.createdAt));

    // Calcul de tendance : uniquement si au moins 2 synthèses IA générées
    let trend: 'aggravation' | 'amelioration' | 'stable' | null = null;

    const withSynthesis = consultations.filter(c => c.aiSynthesis !== null);
    if (withSynthesis.length >= 2) {
      const latest = withSynthesis[0].aiSynthesis!;
      const previous = withSynthesis[1].aiSynthesis!;

      const priorityScore = (level: string) =>
        level === 'urgent' ? 3 : level === 'a_surveiller' ? 2 : 1;
      const worryScore = (level: string) =>
        level === 'élevé' ? 3 : level === 'modéré' ? 2 : 1;

      const latestScore = priorityScore(latest.niveau_priorite) + worryScore(latest.niveau_inquietude_parent);
      const previousScore = priorityScore(previous.niveau_priorite) + worryScore(previous.niveau_inquietude_parent);

      if (latestScore > previousScore) trend = 'aggravation';
      else if (latestScore < previousScore) trend = 'amelioration';
      else trend = 'stable';
    }

    res.json({ ...child, consultations, trend, consultationCount: consultations.length });
  } catch (error: any) {
    console.error('❌ [Children] Erreur dossier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
