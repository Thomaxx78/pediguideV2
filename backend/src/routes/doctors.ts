import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { db } from '../db';
import { doctors } from '../db/schema';
import { eq } from 'drizzle-orm';

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
