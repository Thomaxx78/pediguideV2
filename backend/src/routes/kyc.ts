import { Router } from 'express';
import { startKyc, handleWebhook } from '../controllers/kyc.controller';
import { authenticateToken } from '../middleware/auth.middleware';

export const kycRouter = Router();

/**
 * POST /api/kyc/start
 * Start KYC verification process for a doctor
 * Protected route - requires authentication
 */
kycRouter.post('/start', authenticateToken, startKyc);

/**
 * POST /api/kyc/webhook
 * Webhook endpoint for Didit verification callbacks
 * Public route - signature verification is done in the controller
 */
kycRouter.post('/webhook', handleWebhook);
