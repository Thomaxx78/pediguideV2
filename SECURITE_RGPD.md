# Sécurité & Conformité RGPD — PédiGuide

> Document technique à destination du board d'investissement et des auditeurs.  
> Dernière mise à jour : mai 2026

---

## 1. Données collectées et base légale

| Donnée | Table | Catégorie | Base légale (RGPD) |
|--------|-------|-----------|-------------------|
| Prénom / Nom de l'enfant | `formulaires` | DCP | Intérêt légitime (préparation soin) |
| Date de naissance | `formulaires` | DCP | Intérêt légitime |
| Motif de consultation | `formulaires` | Donnée de santé (art. 9) | Consentement explicite (checkbox étape 5) |
| Signes cliniques, comportement | `formulaires` | Donnée de santé | Consentement explicite |
| Email du patient (session) | `patient_sessions` | DCP | Consentement (envoi lien) |
| Email & RPPS du médecin | `doctors` | DCP pro | Exécution contrat |
| Mot de passe (hashé bcrypt) | `doctors` | — | Sécurité |

### Données de santé — protection renforcée (art. 9 RGPD)

Les données de santé (motif de consultation, signes cliniques, niveau d'inquiétude) ne sont accessibles qu'au médecin concerné via authentification JWT. Elles ne sont jamais transmises à des tiers sans consentement explicite.

---

## 2. Durées de conservation

| Donnée | Durée | Justification |
|--------|-------|---------------|
| Formulaires patient | 24 mois | Suivi médical longitudinal |
| Sessions patient | 7 jours | Expiration automatique du lien |
| Compte médecin | Durée de la relation | Obligation légale (Cnam) |
| Logs applicatifs | 30 jours | Détection d'intrusion |
| Synthèses IA | 24 mois (avec formulaire) | Continuité des soins |

La suppression est automatique via le champ `expires_at` sur `patient_sessions`.

---

## 3. Droits des personnes (art. 15–22 RGPD)

| Droit | Modalité |
|-------|----------|
| Accès | Contacter le médecin responsable du traitement |
| Rectification | Via le médecin ou ré-soumission du formulaire |
| Effacement | Endpoint prévu : `DELETE /api/account` (médecin) |
| Portabilité | Export PDF disponible (`GET /api/diagnosis/:id/pdf`) |
| Opposition | Formulaire non soumis = aucune donnée enregistrée |

**Responsable de traitement :** Le médecin utilisant PédiGuide pour ses patients.  
**Sous-traitant :** PédiGuide SAS (éditeur de la plateforme).

---

## 4. Mesures de sécurité techniques

### 4.1 Transport

- **HTTPS obligatoire** en production (Vercel → TLS 1.3)
- **HSTS** activé via Helmet (`max-age=31536000; includeSubDomains`)
- **CORS** restreint aux origines autorisées (`FRONTEND_URL` + domaine Vercel)

### 4.2 Authentification

| Mécanisme | Détail |
|-----------|--------|
| Hachage mot de passe | bcrypt, facteur de coût 12 |
| Token session | JWT signé HS256, expiration 7 jours |
| Protection user enumeration | Durée de réponse constante (dummy hash) |
| Rate limiting login | 20 requêtes / 15 minutes / IP |
| Rate limiting global | 120 requêtes / minute / IP |

### 4.3 En-têtes de sécurité (Helmet)

```
Content-Security-Policy: default-src 'self'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 4.4 Validation des entrées

Toutes les routes critiques utilisent **Zod** pour valider et sanitiser les corps de requête avant traitement :

- `POST /api/auth/register` → `registerSchema` (RPPS 11 chiffres, email, mdp ≥ 8 cars.)
- `POST /api/auth/login` → `loginSchema`
- `POST /api/diagnosis` → `diagnosisSchema`

### 4.5 Base de données

- PostgreSQL hébergé sur **Supabase** (ISO 27001, datacenter EU-West-2)
- **Row Level Security (RLS)** recommandé en production
- Connexion via `DATABASE_URL` avec `sslmode=require`
- Mots de passe jamais stockés en clair (bcrypt)

### 4.6 Secrets & variables d'environnement

- Aucun secret dans le code source (`.env` dans `.gitignore`)
- `.env.example` fourni comme modèle sans valeurs sensibles
- Rotation des clés JWT recommandée tous les 90 jours

---

## 5. Sous-traitants et transferts

| Service | Usage | Pays | Garantie |
|---------|-------|------|---------|
| Supabase | Base de données PostgreSQL | EU (Ireland) | DPA RGPD |
| Vercel | Hébergement frontend/backend | EU (serverless) | DPA RGPD |
| Groq | Synthèse IA (Llama 3) | USA | Clauses contractuelles types |
| Resend | Envoi emails patients | USA | DPA RGPD |
| Didit | Vérification identité médecin (KYC) | EU | Certifié eIDAS |

> ⚠️ **Groq (USA)** : transfert hors UE couvert par les clauses contractuelles types (CCT). Les données transmises sont anonymisées (pas de nom, prénom, ni date de naissance — seulement les symptômes et motifs).

---

## 6. Gestion des incidents

En cas de violation de données (art. 33 RGPD) :

1. **72h** pour notifier la CNIL (via notifications.cnil.fr)
2. Notification aux personnes concernées si risque élevé (art. 34)
3. Log de l'incident dans un registre interne

---

## 7. Registre des activités de traitement (art. 30)

| # | Finalité | Responsable | Données | Durée |
|---|----------|-------------|---------|-------|
| 1 | Pré-consultation pédiatrique | Médecin (praticien) | Enfant + motif | 24 mois |
| 2 | Authentification médecin | PédiGuide SAS | Email, RPPS, hash mdp | Durée relation |
| 3 | Envoi lien patient | Médecin | Email patient | 7 jours |
| 4 | Vérification identité médecin | PédiGuide SAS | Document identité | 5 ans (obligation légale) |

---

## 8. Disclaimer médico-légal (IA)

Toute synthèse générée par l'IA inclut obligatoirement :

> *"Cette synthèse a été générée automatiquement à partir des réponses du questionnaire pré-consultation. Elle est destinée à faciliter la préparation de la consultation et ne remplace en aucun cas l'examen clinique du médecin."*

Ce disclaimer est :
- Stocké en base avec la synthèse (`ai_synthesis.disclaimer`)
- Affiché systématiquement dans l'interface médecin
- Inclus dans l'export PDF
