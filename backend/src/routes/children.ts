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

    const rawConsultations = await db.select({
      id: diagnosis.id,
      createdAt: diagnosis.createdAt,
      // Motif (legacy + v2)
      consultationReason: diagnosis.consultationReason,
      worry: diagnosis.worry,
      // Symptômes legacy
      clinicalSigns: diagnosis.clinicalSigns,
      behaviorChanges: diagnosis.behaviorChanges,
      worryLevel: diagnosis.worryLevel,
      duration: diagnosis.duration,
      actionsTaken: diagnosis.actionsTaken,
      // Symptômes v2
      symptoms: diagnosis.symptoms,
      symptomOther: diagnosis.symptomOther,
      symptomTimeline: diagnosis.symptomTimeline,
      symptomSeverity: diagnosis.symptomSeverity,
      // Profil médical v2
      allergies: diagnosis.allergies,
      noAllergies: diagnosis.noAllergies,
      treatments: diagnosis.treatments,
      antecedents: diagnosis.antecedents,
      noAntecedents: diagnosis.noAntecedents,
      vaccinations: diagnosis.vaccinations,
      // Mesures
      weight: diagnosis.weight,
      height: diagnosis.height,
      // Divers
      additionalNotes: diagnosis.additionalNotes,
      aiSynthesis: diagnosis.aiSynthesis,
      status: diagnosis.status,
      triageLevel: diagnosis.triageLevel,
    }).from(diagnosis)
      .where(eq(diagnosis.childId, child.id))
      .orderBy(desc(diagnosis.createdAt));

    // Normalise consultationReason: v2 records use `worry`, legacy use `consultationReason`
    const consultations = rawConsultations.map(c => {
      const reason = (c.consultationReason && c.consultationReason !== 'N/A')
        ? c.consultationReason
        : (c.worry ?? null);
      return { ...c, consultationReason: reason };
    });

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

    // Analyse des symptômes récurrents (présents dans ≥ 2 consultations)
    const signCount: Record<string, number> = {};
    for (const c of consultations) {
      const signs = (c.clinicalSigns as string[] | null) ?? [];
      const behaviors = (c.behaviorChanges as string[] | null) ?? [];
      const v2symptoms = (c.symptoms as string[] | null) ?? [];
      const otherSymptom = c.symptomOther ? [c.symptomOther as string] : [];
      const allSymptoms = [...new Set([...signs, ...behaviors, ...v2symptoms, ...otherSymptom])];
      for (const s of allSymptoms) {
        signCount[s] = (signCount[s] ?? 0) + 1;
      }
    }
    const recurringSymptoms = Object.entries(signCount)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([symptom, count]) => ({ symptom, count }));

    // Profil médical : données les plus récentes non vides
    const latestWithData = consultations.find(c =>
      (c.allergies as string[] | null)?.length ||
      c.noAllergies ||
      c.treatments ||
      (c.antecedents as string[] | null)?.length ||
      c.noAntecedents ||
      c.vaccinations
    );
    const medicalProfile = latestWithData ? {
      allergies: (latestWithData.allergies as string[] | null) ?? [],
      noAllergies: latestWithData.noAllergies ?? false,
      treatments: latestWithData.treatments ?? null,
      antecedents: (latestWithData.antecedents as string[] | null) ?? [],
      noAntecedents: latestWithData.noAntecedents ?? false,
      vaccinations: latestWithData.vaccinations ?? null,
    } : null;

    res.json({ ...child, consultations, trend, consultationCount: consultations.length, recurringSymptoms, medicalProfile });
  } catch (error: any) {
    console.error('❌ [Children] Erreur dossier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
