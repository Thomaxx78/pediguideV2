import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { db } from '../db';
import { doctors } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis').max(100).trim().optional(),
  lastName: z.string().min(1, 'Le nom est requis').max(100).trim().optional(),
});

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
        firstName: doctors.firstName,
        lastName: doctors.lastName,
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

/**
 * PATCH /api/doctors/me
 * Update authenticated doctor's editable profile fields
 */
doctorsRouter.patch('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ error: 'Authentication required' });

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Données invalides',
        details: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { firstName, lastName } = parsed.data;
    const updates: Partial<typeof doctors.$inferInsert> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    const [updated] = await db.update(doctors)
      .set(updates)
      .where(eq(doctors.id, doctorId))
      .returning({ id: doctors.id, email: doctors.email, firstName: doctors.firstName, lastName: doctors.lastName });

    res.json({ success: true, doctor: updated });
  } catch (error: any) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
