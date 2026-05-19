import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { validate, registerSchema, loginSchema, diagnosisSchema } from './validate';

const mockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = vi.fn();

const makeReq = (body: unknown): Partial<Request> => ({ body } as any);

describe('validate middleware', () => {
  it('appelle next() si le body est valide', () => {
    const next = vi.fn();
    const req = makeReq({ email: 'test@example.com', password: 'secret123' });
    validate(loginSchema)(req as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('retourne 400 si le body est invalide', () => {
    const next = vi.fn();
    const res = mockRes();
    const req = makeReq({ email: 'pas-un-email', password: '' });
    validate(loginSchema)(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('registerSchema', () => {
  const valid = { rpps: '12345678901', email: 'dr@hopital.fr', password: 'SecurePass1' };

  it('accepte un payload valide', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejette un RPPS trop court', () => {
    expect(registerSchema.safeParse({ ...valid, rpps: '123' }).success).toBe(false);
  });

  it('rejette un RPPS avec des lettres', () => {
    expect(registerSchema.safeParse({ ...valid, rpps: 'ABCDE678901' }).success).toBe(false);
  });

  it('rejette un email invalide', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'pas-un-email' }).success).toBe(false);
  });

  it('rejette un mot de passe trop court', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'abc' }).success).toBe(false);
  });
});

describe('diagnosisSchema', () => {
  const valid = {
    childFirstName: 'Léo',
    childLastName: 'Dupont',
    childBirthDate: '2020-03-15',
    consultationReason: 'Fièvre depuis 2 jours',
    duration: '1 à 3 jours',
    worryLevel: 'Modérément inquiet(e)',
  };

  it('accepte un payload minimal valide', () => {
    expect(diagnosisSchema.safeParse(valid).success).toBe(true);
  });

  it('rejette une date au mauvais format', () => {
    expect(diagnosisSchema.safeParse({ ...valid, childBirthDate: '15/03/2020' }).success).toBe(false);
  });

  it('accepte des champs optionnels', () => {
    const withOptional = {
      ...valid,
      behaviorChanges: ['Agitation'],
      additionalNotes: 'Allergie à la pénicilline',
    };
    expect(diagnosisSchema.safeParse(withOptional).success).toBe(true);
  });
});
