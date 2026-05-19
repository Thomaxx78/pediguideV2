import { Resend } from 'resend';
import type { TierId } from './reminders';

const FROM = 'PédiGuide <onboarding@resend.dev>';

interface SendFormLinkParams {
  to: string;
  patientFirstName?: string | null;
  formUrl: string;
}

interface SendReminderParams extends SendFormLinkParams {
  tier: TierId;
}

const COPY: Record<TierId, { subject: string; intro: string }> = {
  '72h': {
    subject: 'Préparez votre consultation pédiatrique',
    intro:
      'Votre consultation approche. Pour aider le médecin à mieux la préparer, prenez 3 minutes pour remplir le questionnaire.',
  },
  '24h': {
    subject: 'Rappel : votre consultation est demain',
    intro:
      'Votre rendez-vous est demain. Le questionnaire de pré-consultation n\'a pas encore été rempli — cela ne prend que 3 minutes.',
  },
  '2h': {
    subject: 'Dernier rappel avant votre consultation',
    intro:
      'Votre consultation a lieu dans quelques heures. Pour que le médecin soit prêt à vous recevoir, merci de remplir le questionnaire maintenant.',
  },
};

function renderHtml(intro: string, patientFirstName: string | null | undefined, formUrl: string) {
  const greeting = patientFirstName ? ` ${patientFirstName}` : '';
  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #182245;">Préparez votre consultation</h2>
      <p>Bonjour${greeting},</p>
      <p>${intro}</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${formUrl}" style="background: #4A9B8E; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Remplir le questionnaire
        </a>
      </div>
      <p style="color: #6B7280; font-size: 12px;">Si vous ne vous attendiez pas à recevoir cet email, vous pouvez l'ignorer.</p>
    </div>
  `;
}

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY non configurée');
  return new Resend(apiKey);
}

export async function sendFormLinkEmail({ to, patientFirstName, formUrl }: SendFormLinkParams) {
  const resend = getClient();
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Préparez votre consultation — PédiGuide',
    html: renderHtml(
      'Votre médecin vous invite à remplir un questionnaire de pré-consultation avant votre rendez-vous. Cela prend environ 3 minutes.',
      patientFirstName,
      formUrl,
    ),
  });
  if (error) {
    throw new Error(`Resend rejected the email: ${error.message ?? JSON.stringify(error)}`);
  }
}

export async function sendReminderEmail({ to, patientFirstName, formUrl, tier }: SendReminderParams) {
  const resend = getClient();
  const { subject, intro } = COPY[tier];
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: renderHtml(intro, patientFirstName, formUrl),
  });
  if (error) {
    throw new Error(`Resend rejected the reminder email: ${error.message ?? JSON.stringify(error)}`);
  }
}
