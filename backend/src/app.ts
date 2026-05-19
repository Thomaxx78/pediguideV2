import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { diagnosisRouter } from './routes/diagnosis';
import { synthesizeRouter } from './routes/synthesize';
import { sessionsRouter } from './routes/sessions';
import { templatesRouter } from './routes/templates';
import { authRouter } from './routes/auth';
import { kycRouter } from './routes/kyc';
import { doctorsRouter } from './routes/doctors';
import { childrenRouter } from './routes/children';
import { cronRouter } from './routes/cron';

if (!process.env.DATABASE_URL) {
  console.error('❌ ERREUR FATALE : DATABASE_URL est introuvable dans le .env !');
  process.exit(1);
}

const app = express();

// ── Sécurité HTTP ────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://pediguide-frontend.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/ping', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/diagnosis', diagnosisRouter);
app.use('/api/diagnosis', synthesizeRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/children', childrenRouter);
app.use('/api/cron', cronRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route introuvable' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Serveur PRÊT sur http://localhost:${port}`);
});

export default app;
