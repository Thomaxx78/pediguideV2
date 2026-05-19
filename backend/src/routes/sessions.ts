import { Router, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';
import { db } from '../db';
import { patientSessions, diagnosis, doctors } from '../db/schema';
import { authenticateToken, type AuthRequest } from '../middleware/auth.middleware';

export const sessionsRouter = Router();

// POST /api/sessions — créer une session patient (auth médecin)
sessionsRouter.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ error: 'Non authentifié' });

    const { patientEmail, patientFirstName } = req.body;

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const [session] = await db.insert(patientSessions).values({
      doctorId,
      patientToken: token,
      patientEmail: patientEmail || null,
      patientFirstName: patientFirstName || null,
      expiresAt,
    }).returning();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const formUrl = `${baseUrl}/form/${token}`;

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
    const { token } = req.params;
    const [session] = await db.select({
      id: patientSessions.id,
      status: patientSessions.status,
      expiresAt: patientSessions.expiresAt,
      patientFirstName: patientSessions.patientFirstName,
    }).from(patientSessions).where(eq(patientSessions.patientToken, token)).limit(1);

    if (!session) return res.status(404).json({ error: 'Lien introuvable' });
    if (new Date() > new Date(session.expiresAt)) {
      return res.status(410).json({ error: 'Ce lien a expiré' });
    }
    if (session.status === 'completed') {
      return res.status(409).json({ error: 'Ce formulaire a déjà été rempli' });
    }

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/sessions/:token/respond — soumission du formulaire patient (public)
sessionsRouter.post('/:token/respond', async (req, res: Response): Promise<any> => {
  try {
    const { token } = req.params;
    const [session] = await db.select().from(patientSessions)
      .where(eq(patientSessions.patientToken, token)).limit(1);

    if (!session) return res.status(404).json({ error: 'Lien introuvable' });
    if (new Date() > new Date(session.expiresAt)) return res.status(410).json({ error: 'Lien expiré' });
    if (session.status === 'completed') return res.status(409).json({ error: 'Déjà soumis' });

    const data = req.body;
    const [record] = await db.insert(diagnosis).values({
      childFirstName: data.childFirstName,
      childLastName: data.childLastName,
      childBirthDate: data.childBirthDate,
      consultationReason: data.consultationReason,
      behaviorChanges: (data.behaviorChanges || []) as string[],
      clinicalSigns: (data.clinicalSigns || []) as string[],
      duration: data.duration,
      worryLevel: data.worryLevel,
      actionsTaken: (data.actionsTaken || []) as string[],
      additionalNotes: data.additionalNotes || '',
      doctorId: session.doctorId,
      sessionId: session.id,
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
    const { id } = req.params;

    const [session] = await db.select().from(patientSessions)
      .where(and(eq(patientSessions.id, id), eq(patientSessions.doctorId, doctorId!))).limit(1);

    if (!session) return res.status(404).json({ error: 'Session introuvable' });
    if (!session.patientEmail) return res.status(400).json({ error: 'Pas d\'email patient configuré' });

    const [doctor] = await db.select({ email: doctors.email, rpps: doctors.rpps })
      .from(doctors).where(eq(doctors.id, doctorId!)).limit(1);

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY non configurée' });

    const resend = new Resend(apiKey);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const formUrl = `${baseUrl}/form/${session.patientToken}`;

    await resend.emails.send({
      from: 'PédiGuide <onboarding@resend.dev>',
      to: session.patientEmail,
      subject: 'Préparez votre consultation — PédiGuide',
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #182245;">Préparez votre consultation</h2>
          <p>Bonjour${session.patientFirstName ? ` ${session.patientFirstName}` : ''},</p>
          <p>Votre médecin vous invite à remplir un questionnaire de pré-consultation avant votre rendez-vous.</p>
          <p>Cela prend <strong>environ 3 minutes</strong> et permet au médecin de mieux préparer votre consultation.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${formUrl}" style="background: #4A9B8E; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Remplir le questionnaire
            </a>
          </div>
          <p style="color: #6B7280; font-size: 12px;">Ce lien est valable 7 jours. Si vous ne vous attendiez pas à recevoir cet email, vous pouvez l'ignorer.</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('❌ [Sessions] Erreur envoi email:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
  }
});
