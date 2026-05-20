import { Resend } from 'resend';
import type { TierId } from './reminders';

const FROM = 'PédiGuide <onboarding@resend.dev>';

function isDevMode(): boolean {
  return process.env.EMAIL_DEV_MODE === 'true';
}

function logDevEmail(label: string, to: string, subject: string) {
  console.log(`📧 [EMAIL_DEV_MODE] ${label} → ${to} | subject: "${subject}" (not sent — Resend bypassed)`);
}

interface SendFormLinkParams {
  to: string;
  patientFirstName?: string | null;
  formUrl: string;
}

interface SendReminderParams extends SendFormLinkParams {
  tier: TierId;
}

const COPY: Record<TierId, { subject: string; title: string; intro: string; badge: string }> = {
  '72h': {
    subject: 'Préparez votre consultation pédiatrique',
    title: 'Préparez votre consultation',
    badge: 'Dans 3 jours',
    intro:
      'Votre consultation approche. Pour aider le médecin à mieux la préparer, prenez 3 minutes pour remplir le questionnaire.',
  },
  '24h': {
    subject: 'Rappel : votre consultation est demain',
    title: 'Votre consultation est demain',
    badge: 'Demain',
    intro:
      'Votre rendez-vous est demain. Le questionnaire de pré-consultation n\'a pas encore été rempli — cela ne prend que 3 minutes.',
  },
  '2h': {
    subject: 'Dernier rappel avant votre consultation',
    title: 'Votre consultation a lieu aujourd\'hui',
    badge: 'Dans 2 heures',
    intro:
      'Votre consultation a lieu dans quelques heures. Pour que le médecin soit prêt à vous recevoir, merci de remplir le questionnaire maintenant.',
  },
};

function renderHtml(
  intro: string,
  patientFirstName: string | null | undefined,
  formUrl: string,
  title = 'Préparez votre consultation',
  badge?: string,
) {
  const greeting = patientFirstName ? `Bonjour ${patientFirstName},` : 'Bonjour,';
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PédiGuide</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F0E8;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#F0F0E8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#4A9B8E;border-radius:16px 16px 0 0;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <div style="display:inline-block;background-color:rgba(255,255,255,0.2);
                                border-radius:10px;padding:6px 10px;">
                      <span style="color:#ffffff;font-size:18px;font-weight:700;
                                   letter-spacing:-0.3px;">PédiGuide</span>
                    </div>
                  </td>
                  <td align="right">
                    ${badge
                      ? `<span style="background-color:rgba(255,255,255,0.25);color:#ffffff;
                                     font-size:11px;font-weight:700;padding:4px 10px;
                                     border-radius:100px;letter-spacing:0.3px;">${badge}</span>`
                      : `<span style="color:rgba(255,255,255,0.75);font-size:12px;">Consultation pédiatrique</span>`
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 32px;">

              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#182245;
                         letter-spacing:-0.3px;">
                ${title}
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#4A5568;line-height:1.6;">
                ${greeting}
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#4A5568;line-height:1.6;">
                ${intro}
              </p>

              <!-- Phrases rassurantes -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="margin-bottom:28px;">
                <tr>
                  <td style="padding:4px 0;">
                    <span style="color:#4A9B8E;font-size:14px;font-weight:700;">✓</span>
                    <span style="color:#4A5568;font-size:14px;margin-left:8px;">
                      Rapide — moins de 3 minutes, questions simples
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <span style="color:#4A9B8E;font-size:14px;font-weight:700;">✓</span>
                    <span style="color:#4A5568;font-size:14px;margin-left:8px;">
                      Aucune connaissance médicale requise — répondez simplement ce que vous observez
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <span style="color:#4A9B8E;font-size:14px;font-weight:700;">✓</span>
                    <span style="color:#4A5568;font-size:14px;margin-left:8px;">
                      Vos réponses permettent au médecin d'arriver préparé — moins de stress pour vous
                    </span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${formUrl}"
                       style="display:inline-block;background-color:#4A9B8E;color:#ffffff;
                              font-size:15px;font-weight:700;text-decoration:none;
                              padding:14px 36px;border-radius:100px;
                              letter-spacing:0.2px;">
                      Remplir le questionnaire →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Lien de secours -->
              <p style="margin:16px 0 0;font-size:12px;color:#9CA3AF;text-align:center;
                         line-height:1.6;">
                Le bouton ne fonctionne pas ?
                <a href="${formUrl}" style="color:#4A9B8E;text-decoration:underline;">
                  Cliquez ici
                </a>
              </p>

              <!-- Séparateur -->
              <hr style="border:none;border-top:1px solid #F0F0E8;margin:28px 0;" />

              <!-- Encarts rassurants -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="margin-bottom:16px;">
                <tr>
                  <td width="48%" style="background-color:#F6F9F8;border-radius:10px;
                                          padding:14px 16px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#182245;">
                      Confidentiel
                    </p>
                    <p style="margin:0;font-size:12px;color:#4A5568;line-height:1.5;">
                      Vos réponses sont visibles uniquement par votre médecin.
                    </p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color:#F6F9F8;border-radius:10px;
                                          padding:14px 16px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#182245;">
                      Pas de bonne ou mauvaise réponse
                    </p>
                    <p style="margin:0;font-size:12px;color:#4A5568;line-height:1.5;">
                      Décrivez simplement ce que vous avez observé.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Info sécurité -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background-color:#FFF8F6;border-radius:10px;
                              border-left:3px solid #E79276;padding:12px 16px;">
                    <p style="margin:0;font-size:12px;color:#4A5568;line-height:1.6;">
                      <strong style="color:#182245;">Lien personnel et sécurisé</strong>
                      — Ce questionnaire vous a été envoyé par votre médecin.
                      Le lien expire dans 7 jours. Ne le partagez pas.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F0F0E8;border-radius:0 0 16px 16px;
                        padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;">
                Vous recevez cet email car votre médecin vous a invité(e) à remplir
                un questionnaire pré-consultation via PédiGuide.<br />
                Si vous ne vous attendiez pas à cet email, ignorez-le simplement.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY non configurée');
  return new Resend(apiKey);
}

export async function sendFormLinkEmail({ to, patientFirstName, formUrl }: SendFormLinkParams) {
  const subject = 'Préparez votre consultation — PédiGuide';

  if (isDevMode()) {
    logDevEmail('form-link', to, subject);
    return;
  }

  const resend = getClient();
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
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
  const { subject, title, intro, badge } = COPY[tier];

  if (isDevMode()) {
    logDevEmail(`reminder ${tier}`, to, subject);
    return;
  }

  const resend = getClient();
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: renderHtml(intro, patientFirstName, formUrl, title, badge),
  });
  if (error) {
    throw new Error(`Resend rejected the reminder email: ${error.message ?? JSON.stringify(error)}`);
  }
}
