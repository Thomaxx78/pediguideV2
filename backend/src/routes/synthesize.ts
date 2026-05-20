import { Router, Response } from 'express';
import Groq from 'groq-sdk';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { aiSynthesisVersions, diagnosis, type AiSynthesis } from '../db/schema';
import { authenticateToken, type AuthRequest } from '../middleware/auth.middleware';

export const synthesizeRouter = Router();
const AI_MODEL = 'llama-3.3-70b-versatile';
const PROMPT_VERSION = '2026-05-20-v1';

const SYSTEM_PROMPT = `Tu es un assistant médical qui aide les pédiatres à préparer leurs consultations.
À partir des réponses d'un questionnaire pré-consultation rempli par un parent,
génère une synthèse clinique structurée et concise.

Règles :
- Ton neutre et factuel, langage médical accessible
- Ne jamais poser de diagnostic
- Signaler clairement les éléments nécessitant une attention particulière
- Toujours inclure le disclaimer médico-légal en fin de synthèse
- Répondre en français
- Retourner uniquement le JSON, sans markdown ni texte autour

Mots-clés urgents à détecter : fièvre > 39°C, convulsions, difficultés respiratoires, cyanose,
perte de conscience, raideur de la nuque, éruption cutanée soudaine, saignement important,
traumatisme crânien, déshydratation sévère.

Format JSON attendu :
{
  "motif_principal": "string",
  "symptomes_cles": ["string"],
  "duree_evolution": "string",
  "niveau_inquietude_parent": "faible | modéré | élevé",
  "actions_deja_prises": ["string"],
  "points_attention": ["string"],
  "niveau_priorite": "non_urgent | a_surveiller | urgent",
  "resume_message_libre": "string | null",
  "disclaimer": "Cette synthèse a été générée automatiquement à partir des réponses du questionnaire pré-consultation. Elle est destinée à faciliter la préparation de la consultation et ne remplace en aucun cas l'examen clinique du médecin."
}`;

synthesizeRouter.post('/:id/synthesize', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id || '');
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const results = await db.select().from(diagnosis)
      .where(and(eq(diagnosis.id, id), eq(diagnosis.doctorId, doctorId)))
      .limit(1);
    const record = results[0];

    if (!record) {
      return res.status(404).json({ error: 'Formulaire introuvable' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY non configurée' });
    }

    const client = new Groq({ apiKey });

    const responseData = {
      motif_consultation: record.consultationReason,
      changements_comportement: record.behaviorChanges ?? [],
      signes_cliniques: record.clinicalSigns ?? [],
      duree_symptomes: record.duration,
      niveau_inquietude_parent: record.worryLevel,
      actions_deja_prises: record.actionsTaken ?? [],
      notes_complementaires: record.additionalNotes ?? '',
    };

    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Voici les réponses du parent au questionnaire pré-consultation :\n\n${JSON.stringify(responseData, null, 2)}\n\nGénère la synthèse clinique au format JSON strict, sans balises markdown.`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const rawText = completion.choices[0].message.content ?? '';
    console.log('🤖 [Synthesize] Raw response:', rawText.substring(0, 200));
    const synthesis: AiSynthesis = JSON.parse(rawText);

    const [latestVersion] = await db.select({ version: aiSynthesisVersions.version })
      .from(aiSynthesisVersions)
      .where(eq(aiSynthesisVersions.diagnosisId, id))
      .orderBy(desc(aiSynthesisVersions.version))
      .limit(1);
    const nextVersion = (latestVersion?.version ?? 0) + 1;

    const [createdVersion] = await db.insert(aiSynthesisVersions).values({
      diagnosisId: id,
      version: nextVersion,
      synthesis,
      model: AI_MODEL,
      promptVersion: PROMPT_VERSION,
      generatedByDoctorId: doctorId,
    }).returning();

    await db.update(diagnosis)
      .set({ aiSynthesis: synthesis })
      .where(and(eq(diagnosis.id, id), eq(diagnosis.doctorId, doctorId)));

    res.json({ synthesis, version: createdVersion, cached: false });
  } catch (error: any) {
    console.error('❌ [Synthesize] Erreur:', error);
    if (error instanceof SyntaxError) {
      return res.status(502).json({ error: 'Réponse IA invalide, réessayez.' });
    }
    res.status(500).json({ error: 'Erreur lors de la génération de la synthèse' });
  }
});

synthesizeRouter.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = String(req.params.id || '');
    const doctorId = req.user?.id;
    const results = await db.select().from(diagnosis)
      .where(and(eq(diagnosis.id, id), eq(diagnosis.doctorId, doctorId!)))
      .limit(1);
    const record = results[0];
    if (!record) {
      return res.status(404).json({ error: 'Formulaire introuvable' });
    }
    const versions = await db.select().from(aiSynthesisVersions)
      .where(eq(aiSynthesisVersions.diagnosisId, id))
      .orderBy(desc(aiSynthesisVersions.version));
    res.json({ ...record, aiSynthesisVersions: versions });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
