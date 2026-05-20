import { Router, Request, Response } from 'express';
import { eq, and, isNotNull, gt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { patientSessions } from '../db/schema';
import { nextReminderToSend, type TierId } from '../lib/reminders';
import { sendReminderEmail } from '../lib/email';

export const cronRouter = Router();

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers['authorization'];
  return header === `Bearer ${secret}`;
}

cronRouter.post('/send-reminders', async (req: Request, res: Response): Promise<any> => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();

  try {
    const candidates = await db.select().from(patientSessions).where(
      and(
        eq(patientSessions.status, 'pending'),
        isNotNull(patientSessions.appointmentAt),
        isNotNull(patientSessions.patientEmail),
        gt(patientSessions.appointmentAt, now),
      ),
    );

    let sent = 0;
    const details: Array<{ sessionId: string; tier: TierId }> = [];

    for (const session of candidates) {
      if (!session.appointmentAt || !session.patientEmail) continue;

      const tier = nextReminderToSend({
        appointmentAt: new Date(session.appointmentAt),
        remindersSent: (session.remindersSent ?? []) as TierId[],
        now,
      });

      if (!tier) continue;

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const formUrl = `${baseUrl}/form/${session.patientToken}`;

      try {
        await sendReminderEmail({
          to: session.patientEmail,
          patientFirstName: session.patientFirstName,
          formUrl,
          tier,
        });

        await db.update(patientSessions)
          .set({
            remindersSent: sql`array_append(${patientSessions.remindersSent}, ${tier})`,
            lastReminderAt: now,
          })
          .where(eq(patientSessions.id, session.id));

        sent++;
        details.push({ sessionId: session.id, tier });
      } catch (emailErr) {
        console.error(`❌ [Cron] Email failed for session ${session.id}:`, emailErr);
      }
    }

    return res.json({ processed: candidates.length, sent, details });
  } catch (err) {
    console.error('❌ [Cron] send-reminders failed:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});
