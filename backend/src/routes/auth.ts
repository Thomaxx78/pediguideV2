import { Router, Request, Response } from 'express';
import { db } from '../db';
import { doctors } from '../db/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { validate, registerSchema, loginSchema } from '../middleware/validate';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    const { firstName, lastName, rpps, email, password, cpsCardUrl } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.insert(doctors).values({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      rpps,
      email: email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      cpsCardUrl: cpsCardUrl || null,
    }).returning({ id: doctors.id, email: doctors.email });

    res.status(201).json({ success: true, doctor: result[0] });

  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Ce numéro RPPS ou cet email est déjà utilisé.' });
    }
    console.error('[AUTH] Erreur inscription:', error);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
  }
});

authRouter.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const result = await db
      .select()
      .from(doctors)
      .where(eq(doctors.email, email.toLowerCase().trim()))
      .limit(1);

    // Constant-time response to prevent user enumeration
    const doctor = result[0];
    const dummyHash = '$2b$12$invalidhashfortimingprotection000000000000000000000000';
    const isValidPassword = doctor
      ? await bcrypt.compare(password, doctor.passwordHash)
      : await bcrypt.compare(password, dummyHash);

    if (!doctor || !isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[AUTH] FATAL: JWT_SECRET manquant');
      return res.status(500).json({ error: 'Erreur de configuration serveur.' });
    }

    const token = jwt.sign(
      { id: doctor.id },
      jwtSecret,
      { expiresIn: '7d' },
    );

    res.json({
      success: true,
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        rpps: doctor.rpps,
        kycStatus: doctor.kycStatus,
      },
    });

  } catch (error: any) {
    console.error('[AUTH] Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});
