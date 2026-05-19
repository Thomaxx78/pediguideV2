import { Router, Request, Response } from 'express';
import { db } from '../db';
import { doctors } from '../db/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response): Promise<any> => {
  console.log("📝 [AUTH] Register request received", req.body);
  try {
    const { rpps, email, password, cpsCardUrl } = req.body;

    if (!password) {
      console.error("❌ [AUTH] Password missing");
      return res.status(400).json({ error: "Mot de passe requis" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("🔒 [AUTH] Password hashed");

    console.log("💾 [AUTH] Inserting doctor into DB...");
    const result = await db.insert(doctors).values({
      rpps,
      email,
      passwordHash: hashedPassword,
      cpsCardUrl: cpsCardUrl || null,
    }).returning({ id: doctors.id, email: doctors.email });

    console.log("✅ [AUTH] Doctor created:", result[0]);
    res.json({ success: true, doctor: result[0] });

  } catch (error: any) {
    console.error("❌ [AUTH] Erreur inscription:", error);
    if (error?.code === '23505') {
      return res.status(400).json({ error: "Ce numéro RPPS ou cet email est déjà utilisé." });
    }
    res.status(500).json({ error: "Erreur serveur lors de l'inscription: " + error.message });
  }
});

authRouter.post('/login', async (req: Request, res: Response): Promise<any> => {
  console.log("🔑 [AUTH] Login request received for:", req.body.email);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find doctor by email
    const result = await db
      .select()
      .from(doctors)
      .where(eq(doctors.email, email))
      .limit(1);

    if (!result.length) {
      console.warn("⚠️ [AUTH] User not found:", email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const doctor = result[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, doctor.passwordHash);

    if (!isValidPassword) {
      console.warn("⚠️ [AUTH] Invalid password for:", email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('❌ [AUTH] FATAL: JWT_SECRET is not configured!');
      return res.status(500).json({ error: 'Server configuration error: JWT_SECRET missing' });
    }

    const token = jwt.sign(
      { id: doctor.id },
      jwtSecret,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    console.log("✅ [AUTH] Login successful for:", email);
    res.json({
      success: true,
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        rpps: doctor.rpps,
        kycStatus: doctor.kycStatus,
      },
    });

  } catch (error: any) {
    console.error('❌ [AUTH] Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});