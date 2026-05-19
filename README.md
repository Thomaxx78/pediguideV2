# PédiGuide — Application de pré-consultation pédiatrique

> Outil web permettant aux soignants d'envoyer un questionnaire aux parents avant le rendez-vous. Le médecin reçoit une fiche de synthèse IA avant l'arrivée du patient.

**Démo live :** [pediguide-frontend.vercel.app](https://pediguide-frontend.vercel.app)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND — Vue.js 3 / Vite                    │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────────┐ │
│  │  Espace médecin  │  │ Formulaire       │  │  Synthèse IA         │ │
│  │  (auth JWT)      │  │ patient          │  │  (fiche pré-consult) │ │
│  │  /dashboard      │  │ /form/:token     │  │  /dashboard/:id      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────────────┘ │
└─────────────────────────────┬────────────────────────────────────────┘
                              │ HTTPS / TLS 1.3
                              │ Authorization: Bearer <JWT>
┌─────────────────────────────▼────────────────────────────────────────┐
│                   BACKEND — Express.js (Vercel Serverless)            │
│                                                                      │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ Helmet       │  │ Rate limiting  │  │ CORS       │  │ Zod      │  │
│  │ (CSP, HSTS)  │  │ (20 req/15min) │  │ (allowlist)│  │ (valid.) │  │
│  └──────────────┘  └───────────────┘  └────────────┘  └──────────┘  │
│                                                                      │
│  POST /api/auth/login     → bcrypt compare + JWT sign                │
│  POST /api/auth/register  → bcrypt hash (coût 12)                    │
│  GET  /api/diagnosis      → liste formulaires (auth requise)         │
│  POST /api/diagnosis      → soumission patient (token session)       │
│  POST /api/diagnosis/:id/synthesize → appel LLM Groq                │
│  GET  /api/diagnosis/:id/pdf        → export PDF (pdfkit)            │
│  POST /api/sessions       → génération lien unique patient           │
│  POST /api/kyc/start      → vérification identité médecin (Didit)   │
└──────────┬───────────────────────────────────────┬───────────────────┘
           │                                       │
┌──────────▼──────────┐               ┌────────────▼──────────────────┐
│  Supabase PostgreSQL │               │  Services externes             │
│  (EU-West-2)         │               │                               │
│                      │               │  Groq   → Synthèse LLM        │
│  doctors             │               │  Resend → Emails patients      │
│  form_templates      │               │  Didit  → KYC médecin         │
│  patient_sessions    │               │                               │
│  formulaires         │               └───────────────────────────────┘
│  (RLS recommandé)    │
└──────────────────────┘
```

### Justification des choix techniques

| Choix | Justification |
|-------|---------------|
| **Vue.js 3 + Composition API** | Réactivité fine, TypeScript natif, ecosystem mature |
| **Express.js serverless (Vercel)** | Zero cold-start critique, déploiement sans infra à gérer |
| **Drizzle ORM** | Type-safe, migrations versionnées, compatible Supabase |
| **Supabase (PostgreSQL)** | Scalable, EU, RLS intégré, backups automatiques |
| **Groq (Llama 3.3 70B)** | Inférence rapide (<2s), moins coûteux qu'OpenAI, RGPD via CCT |
| **JWT stateless** | Pas de session serveur, compatible serverless |
| **bcrypt coût 12** | Équilibre sécurité / performance (≈300ms, résistant au brute-force) |
| **Zod** | Validation runtime + types TypeScript inférés automatiquement |
| **Helmet** | 15 headers de sécurité en une ligne, standard de l'industrie |

---

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Vue.js 3, Vite, TypeScript, Tailwind CSS v4, Pinia, shadcn-vue |
| **Backend** | Express.js 5, Node.js 20, TypeScript |
| **BDD** | PostgreSQL (Supabase), Drizzle ORM |
| **Auth** | JWT (jsonwebtoken), bcrypt |
| **Sécurité** | Helmet, express-rate-limit, Zod, CORS restreint |
| **IA** | Groq SDK (Llama 3.3 70B) |
| **Email** | Resend |
| **KYC** | Didit |
| **Tests** | Vitest (unitaires), Playwright (E2E) |
| **CI/CD** | GitHub Actions → Vercel |

---

## Installation locale

### Prérequis

- Node.js ≥ 20
- Docker Desktop (base de données locale)

### 1. Cloner

```bash
git clone https://github.com/arthurgramont/pediguide.git
cd pediguide
```

### 2. Variables d'environnement

```bash
cp backend/.env.example backend/.env
# Remplir les valeurs dans backend/.env
```

### 3. Démarrer (Docker recommandé)

```bash
docker compose up --build
# Frontend : http://localhost:5173
# Backend  : http://localhost:3000
```

### 4. Démarrer manuellement

```bash
# Backend
cd backend && npm install && npm run migrate && npm run dev

# Frontend (autre terminal)
cd frontend && npm install && npm run dev
```

---

## Base de données

```bash
cd backend
npm run generate   # génère les migrations SQL
npm run migrate    # applique à la base
npm run push       # sync direct (dev uniquement)
```

**Schéma (4 tables) :**

```
doctors           → médecins (RPPS, email, passwordHash, kycStatus)
form_templates    → modèles de questionnaires (JSONB questions)
patient_sessions  → liens uniques patient (token, expiration 7j)
formulaires       → réponses patient + synthèse IA (JSONB)
```

---

## Tests

### Unitaires (Vitest)

```bash
cd backend
npm test                 # run
npm run test:coverage    # avec rapport de couverture
```

Couvre :
- `auth.middleware.ts` — 6 cas (token absent, invalide, expiré, valide, JWT_SECRET manquant)
- `validate.ts` — schémas Zod register, login, diagnosis

### E2E (Playwright)

```bash
cd frontend
npm run test:e2e         # headless
npm run test:e2e:ui      # interface graphique Playwright
```

Couvre :
- Parcours complet formulaire patient (5 étapes)
- Navigation et pages publiques
- Validation des champs obligatoires
- Bouton Retour

---

## Sécurité

Voir [SECURITE_RGPD.md](./SECURITE_RGPD.md) pour la documentation complète.

**Mesures actives :**

| Mesure | Détail |
|--------|--------|
| Headers HTTP | Helmet (CSP, HSTS, X-Frame-Options...) |
| CORS | Restreint à `FRONTEND_URL` + domaine Vercel |
| Rate limiting | 20 req/15min sur `/api/auth`, 120 req/min global |
| Mots de passe | bcrypt coût 12 |
| Tokens | JWT HS256, expiration 7j |
| Protection timing | Hash dummy sur login (anti-enumeration) |
| Validation | Zod sur toutes les routes critiques |
| Secrets | `.env` dans `.gitignore`, `.env.example` fourni |

---

## CI/CD

```
push tag v*.*.* 
  → quality-check (lint + npm audit)
  → deploy-backend (Vercel)
  → deploy-frontend (Vercel)
  → smoke-test (/ping)
  → notify (Discord)
```

### Déployer une nouvelle version

```bash
git tag v1.0.X
git push origin v1.0.X
```

---

## Structure du projet

```
.
├── .github/workflows/    # CI/CD GitHub Actions
├── backend/
│   ├── src/
│   │   ├── db/           # Schéma Drizzle + connexion
│   │   ├── middleware/   # auth.middleware.ts, validate.ts (Zod)
│   │   ├── routes/       # auth, diagnosis, sessions, templates, kyc, doctors
│   │   ├── services/     # didit.service.ts
│   │   └── app.ts        # Express + sécurité (Helmet, CORS, rate-limit)
│   ├── .env.example
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── components/   # UI (shadcn-vue + composants custom)
│   │   ├── pages/        # Vues (Diagnosis, Dashboard, Login...)
│   │   ├── stores/       # Pinia
│   │   └── router/       # Vue Router + guards auth
│   ├── tests/e2e/        # Tests Playwright
│   └── playwright.config.ts
├── SECURITE_RGPD.md      # Conformité RGPD + mesures sécurité
├── docker-compose.yml
└── .gitignore
```
