import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): any => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Données invalides',
        details: result.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}

// ── Schémas de validation ─────────────────────────────────────────────────────

export const registerSchema = z.object({
  rpps: z
    .string()
    .min(11, 'Le numéro RPPS doit contenir 11 chiffres')
    .max(11, 'Le numéro RPPS doit contenir 11 chiffres')
    .regex(/^\d+$/, 'Le numéro RPPS ne doit contenir que des chiffres'),
  email: z.string().email('Adresse email invalide').max(255),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128),
  cpsCardUrl: z.string().url().optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const diagnosisSchema = z.object({
  childFirstName: z.string().min(1).max(100),
  childLastName: z.string().min(1).max(100),
  childBirthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  consultationReason: z.string().min(1).max(2000),
  behaviorChanges: z.array(z.string()).optional(),
  clinicalSigns: z.array(z.string()).optional(),
  duration: z.string().min(1),
  worryLevel: z.string().min(1),
  actionsTaken: z.array(z.string()).optional(),
  additionalNotes: z.string().max(2000).optional(),
  sessionId: z.string().uuid().optional(),
  customAnswers: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  formTemplateId: z.string().uuid().optional(),
});
