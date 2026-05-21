import { Router, Response } from 'express';
import { sql, eq, and, isNotNull } from 'drizzle-orm';
import { db } from '../db';
import { diagnosis, patientSessions, response_table } from '../db/schema';
import { authenticateToken, type AuthRequest } from '../middleware/auth.middleware';

export const statsRouter = Router();

const SYMPTOM_LABELS: Record<string, string> = {
  'sym-fever': 'Fièvre',
  'sym-fatigue': 'Fatigue inhabituelle',
  'sym-appetite': "Perte d'appétit",
  'sym-irritability': 'Pleurs / irritabilité',
  'sym-sleep': 'Trouble du sommeil',
  'sym-cough': 'Toux',
  'sym-runny-nose': 'Nez qui coule',
  'sym-sore-throat': 'Mal de gorge',
  'sym-breathing': 'Difficulté à respirer',
  'sym-wheeze': 'Sifflement',
  'sym-vomiting': 'Vomissements',
  'sym-diarrhea': 'Diarrhée',
  'sym-belly': 'Mal au ventre',
  'sym-refuse-drink': 'Refuse de boire',
  'sym-constipation': 'Constipation',
  'sym-rash': 'Éruption / boutons',
  'sym-itching': 'Démangeaisons',
  'sym-ear': "Mal d'oreille",
  'sym-eye': 'Œil rouge ou collé',
};

statsRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ error: 'Non authentifié' });

    // 1. Taux de complétion
    const [completionRow] = await db
      .select({
        total: sql<number>`COUNT(*)::int`,
        completed: sql<number>`COUNT(CASE WHEN ${patientSessions.status} = 'completed' THEN 1 END)::int`,
      })
      .from(patientSessions)
      .where(eq(patientSessions.doctorId, doctorId));

    const total = completionRow?.total ?? 0;
    const completed = completionRow?.completed ?? 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 2. Temps moyen de complétion (en minutes)
    const [timeRow] = await db
      .select({
        avgMinutes: sql<number>`ROUND(AVG(EXTRACT(EPOCH FROM (${response_table.answeredAt} - ${patientSessions.createdAt})) / 60))::int`,
      })
      .from(response_table)
      .innerJoin(diagnosis, eq(diagnosis.id, response_table.diagnosis_id))
      .innerJoin(patientSessions, eq(patientSessions.id, diagnosis.sessionId))
      .where(
        and(
          eq(diagnosis.doctorId, doctorId),
          isNotNull(response_table.answeredAt),
          isNotNull(diagnosis.sessionId),
        ),
      );

    const avgCompletionMinutes = timeRow?.avgMinutes ?? null;

    // 3. Répartition des priorités (source : synthèse IA uniquement)
    const priorityRows = await db.execute(
      sql`
        SELECT ai_synthesis->>'niveau_priorite' AS level, COUNT(*)::int AS count
        FROM formulaires
        WHERE doctor_id = ${doctorId}
          AND ai_synthesis IS NOT NULL
          AND ai_synthesis->>'niveau_priorite' IS NOT NULL
        GROUP BY ai_synthesis->>'niveau_priorite'
      `,
    ) as { level: string; count: number }[];

    const priorityDistribution: Record<string, number> = {
      non_urgent: 0,
      a_surveiller: 0,
      urgent: 0,
    };
    for (const row of priorityRows) {
      if (row.level && row.level in priorityDistribution) {
        priorityDistribution[row.level] = row.count;
      }
    }

    // 4. Top 5 symptômes
    const symptomRows = await db.execute(
      sql`
        SELECT symptom, COUNT(*)::int AS count
        FROM formulaires,
             jsonb_array_elements_text(symptoms) AS symptom
        WHERE doctor_id = ${doctorId}
          AND symptoms IS NOT NULL
          AND jsonb_array_length(symptoms) > 0
        GROUP BY symptom
        ORDER BY count DESC
        LIMIT 5
      `,
    ) as { symptom: string; count: number }[];

    const topSymptoms = symptomRows.map((row) => ({
      id: row.symptom,
      label: SYMPTOM_LABELS[row.symptom] ?? row.symptom,
      count: row.count,
    }));

    res.json({
      completionRate,
      totalSessions: total,
      completedSessions: completed,
      avgCompletionMinutes,
      priorityDistribution,
      topSymptoms,
    });
  } catch (error: any) {
    console.error('❌ [Stats] Erreur:', error);
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
  }
});
