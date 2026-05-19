import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';

import { diagnosisRouter } from './routes/diagnosis';
import { synthesizeRouter } from './routes/synthesize';
import { sessionsRouter } from './routes/sessions';
import { authRouter } from './routes/auth';
import { kycRouter } from './routes/kyc';
import { doctorsRouter } from './routes/doctors';

console.log("🔄 Initialisation du serveur...");

if (!process.env.DATABASE_URL) {
  console.error("❌ ERREUR FATALE : DATABASE_URL est introuvable dans le .env !");
  process.exit(1);
} else {
  console.log("✅ DATABASE_URL détectée.");
}

const app = express();

app.use(cors({origin: '*'}));
app.use(express.json());

// Route de test
app.get('/ping', (req: Request, res: Response) => {
  res.send('PONG ! Le serveur est vivant.');
});

// Routes API
app.use('/api/diagnosis', diagnosisRouter);
app.use('/api/diagnosis', synthesizeRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/doctors', doctorsRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 Serveur PRÊT sur http://localhost:${port}`);
    console.log(`👉 Teste moi avec : curl http://localhost:${port}/ping`);
});

export default app