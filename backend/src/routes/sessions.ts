import { Router, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { patientSessions, diagnosis, doctors, formTemplates, children, DEFAULT_QUESTIONS } from '../db/schema';
import { authenticateToken, type AuthRequest } from '../middleware/auth.middleware';
import { sendFormLinkEmail } from '../lib/email';
import { computeTriageScore } from '../services/triage.service';

export const sessionsRouter = Router();

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

    // Charger les questions du template si associé
    let questions = DEFAULT_QUESTIONS;
    if (row.formTemplateId) {
      const [template] = await db.select({ questions: formTemplates.questions })
        .from(formTemplates).where(eq(formTemplates.id, row.formTemplateId)).limit(1);
      if (template) questions = template.questions;
    }

    res.json({ ...row, questions });
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
    const isCustom = !!session.formTemplateId;
    const nir: string | null = data.nir?.trim() || null;

    // For custom templates: build labeled answers map { [question label]: answer }
    let labeledCustomAnswers: Record<string, string | string[]> | null = null;
    if (isCustom && data.answers) {
      const [template] = await db.select({ questions: formTemplates.questions })
        .from(formTemplates).where(eq(formTemplates.id, session.formTemplateId!)).limit(1);
      if (template?.questions) {
        const questions = template.questions as Array<{ id: string; label: string }>;
        labeledCustomAnswers = {};
        for (const q of questions) {
          if (data.answers[q.id] !== undefined) {
            labeledCustomAnswers[q.label] = data.answers[q.id];
          }
        }
      }
    }

    // Matching NIR : cherche ou crée le dossier enfant
    let childId: string | null = null;
    if (nir) {
      const firstName = (data.childFirstName || data.answers?.q1 || '').trim();
      const lastName = (data.childLastName || data.answers?.q2 || '').trim();
      const birthDate = (data.childBirthDate || data.answers?.q3 || '').trim();

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

    const childBirthDate = data.childBirthDate || data.answers?.q3 || 'N/A';
    const behaviorChanges = (data.behaviorChanges || data.answers?.q5 || []) as string[];
    const clinicalSigns = (data.clinicalSigns || data.answers?.q6 || []) as string[];
    const duration = data.duration || data.answers?.q7 || '';
    const worryLevel = data.worryLevel || data.answers?.q8 || '';
    const actionsTaken = (data.actionsTaken || data.answers?.q9 || []) as string[];
    const additionalNotes = data.additionalNotes || data.answers?.q10 || '';

    const triage = computeTriageScore({
      clinicalSigns,
      behaviorChanges,
      worryLevel,
      duration,
      childBirthDate,
    });

    const [record] = await db.insert(diagnosis).values({
      childFirstName: data.childFirstName || data.answers?.q1 || session.patientFirstName || 'N/A',
      childLastName: data.childLastName || data.answers?.q2 || 'N/A',
      childBirthDate,
      consultationReason: data.consultationReason || data.answers?.q4 || 'N/A',
      behaviorChanges,
      clinicalSigns,
      duration: duration || 'N/A',
      worryLevel: worryLevel || 'N/A',
      actionsTaken,
      additionalNotes,

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
      customAnswers: isCustom ? (labeledCustomAnswers ?? data.answers ?? {}) : null,
      childId,
      nir,
      triageLevel: triage.level,
      triageScore: String(triage.score),
    }).returning({ id: diagnosis.id });

    await db.update(patientSessions)
      .set({ status: 'completed' })
      .where(eq(patientSessions.id, session.id));

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
