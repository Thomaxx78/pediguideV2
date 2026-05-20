import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from './auth.middleware';

const JWT_SECRET = 'test-secret-for-unit-tests';

const mockReq = (authHeader?: string): Partial<Request> => ({
  headers: authHeader ? { authorization: authHeader } : {},
});

const mockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = vi.fn();

describe('authenticateToken middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('retourne 401 si aucun token fourni', () => {
    const req = mockReq();
    const res = mockRes();

    authenticateToken(req as Request, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('retourne 401 si header Authorization malformé', () => {
    const req = mockReq('InvalidFormat');
    const res = mockRes();

    authenticateToken(req as Request, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('retourne 403 si token invalide (signature incorrecte)', () => {
    const fakeToken = jwt.sign({ id: 'user-1' }, 'wrong-secret');
    const req = mockReq(`Bearer ${fakeToken}`);
    const res = mockRes();

    authenticateToken(req as Request, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('retourne 403 si token expiré', () => {
    const expiredToken = jwt.sign({ id: 'user-1' }, JWT_SECRET, { expiresIn: '-1s' });
    const req = mockReq(`Bearer ${expiredToken}`);
    const res = mockRes();

    authenticateToken(req as Request, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('appelle next() et attache user si token valide', () => {
    const validToken = jwt.sign({ id: 'doctor-uuid-123' }, JWT_SECRET, { expiresIn: '1h' });
    const req = mockReq(`Bearer ${validToken}`) as any;
    const res = mockRes();

    authenticateToken(req as Request, res as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'doctor-uuid-123' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('retourne 500 si JWT_SECRET absent', () => {
    delete process.env.JWT_SECRET;
    const token = jwt.sign({ id: 'user-1' }, JWT_SECRET);
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();

    authenticateToken(req as Request, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
