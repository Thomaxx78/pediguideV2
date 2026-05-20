import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { db } from '../db';
import { diagnosis, diagnosis_question_proposition_table, diagnosis_question_table, diagnosis_section_table, doctors, question_type_enum, response_table } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

export interface Proposition {
  proposition: string
}

export interface Question {
  propositions: Proposition[]
  question: string
  description: string
  type: typeof question_type_enum.enumValues[number]
}

export interface Section {
  questions: Question[]
  title: string
  description: string
}

export interface CreateForm {
  questions: Question[]
  sections: Section[]
}

export const doctorsRouter = Router();

/**
 * GET /api/doctors/me
 * Get authenticated doctor's profile
 * Protected route - requires authentication
 */
doctorsRouter.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user?.id;

    if (!doctorId) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    // Fetch doctor profile from database
    const result = await db
      .select({
        id: doctors.id,
        rpps: doctors.rpps,
        email: doctors.email,
        cpsCardUrl: doctors.cpsCardUrl,
        accountStatus: doctors.accountStatus,
        kycStatus: doctors.kycStatus,
        kycSessionId: doctors.kycSessionId,
        createdAt: doctors.createdAt,
      })
      .from(doctors)
      .where(eq(doctors.id, doctorId))
      .limit(1);

    if (!result.length) {
      return res.status(404).json({
        error: 'Doctor not found',
      });
    }

    res.json({
      success: true,
      doctor: result[0],
    });
  } catch (error: any) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      details: error.message,
    });
  }
});

doctorsRouter.post('/create-form', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const body: CreateForm = req.body
  const transactionResults = await db.transaction(async tx => {
    const [createdDiagnosis] = await tx.insert(diagnosis).values({
      doctorId: req.user!.id
    }).returning()
    const [createdSections, createdRootQuestions] = await Promise.all([
      body.sections.length ? tx.insert(diagnosis_section_table).values(
        body.sections.map(s => ({
          title: s.title,
          description: s.description,
          diagnosis_id: createdDiagnosis.id
        }))
      ).returning() : [],
      body.questions.length ? tx.insert(diagnosis_question_table).values(
        body.questions.map(q => ({
          question: q.question,
          description: q.description,
          type: q.type,
          diagnosis_id: createdDiagnosis.id,
        }))
      ).returning() : [],
    ])

    const [createdSectionQuestions, createdRootQuestionPropositions] = await Promise.all([
      body.sections.length ? tx.insert(diagnosis_question_table).values(
        body.sections.flatMap(
          (s, section_index) => s.questions.flatMap(
            (q) => ({
              diagnosis_id: createdDiagnosis.id,
              section_id: createdSections[section_index]!.id,
              question: q.question,
              description: q.description,
              type: q.type,
            })
          )
        )
      ).returning() : [],
      body.questions ? tx.insert(diagnosis_question_proposition_table).values(
        body.questions.flatMap(
          (q, question_index) => q.propositions.map(
            p => ({
              diagnosis_id: createdDiagnosis.id,
              section_id: null,
              question_id: createdRootQuestions[question_index]!.id,
              proposition: p.proposition
            })
          )
        )
      ).returning() : []
    ])

    let createdSectionQuestionPropositions: typeof diagnosis_question_proposition_table.$inferInsert[] = []
    if(body.sections.length) {
      createdSectionQuestionPropositions = await tx.insert(diagnosis_question_proposition_table)
      .values(
        body.sections.flatMap(
          (s, section_index) => s.questions.flatMap(
            (q, question_index) => q.propositions.map(p => ({
              diagnosis_id: createdDiagnosis.id,
              section_id: createdSections[section_index]!.id,
              question_id: createdSectionQuestions[question_index]!.id,
              proposition: p.proposition
            }))
          )
        )
      ).returning()
    }
  })

  const [created] = await db.query.diagnosis.findMany({
    where: eq(diagnosis.doctorId, req.user!.id),
    with: {
      questions: {
        with: {
          propositions: true
        }
      },
      sections: {
        with: {
          questions: {
            with: {
              propositions: true
            }
          }
        }
      }
    },
    orderBy: desc(diagnosis.createdAt),
    limit: 1,
  })

  return res.send(created)
})

doctorsRouter.post('/create-form-response', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  const {
    diagnosis_id
  } = req.body
  const [createdFormResponse] = await db.insert(response_table).values({
    diagnosis_id
  }).returning()

  res.send(createdFormResponse)
})

doctorsRouter.get('/forms', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const forms = await db.query.diagnosis.findMany({
      where: eq(diagnosis.doctorId, req.user!.id),
      with: {
        questions: {
          with: {
            propositions: true
          }
        },
        sections: {
          with: {
            questions: {
              with: {
                propositions: true
              }
            }
          }
        }
      }
    });

    return res.json(forms);
  } catch (error: any) {
    console.error('Error fetching doctor forms:', error);
    res.status(500).json({
      error: 'Failed to fetch doctor forms',
      details: error.message,
    });
  }
})
