import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { desc, eq, and, ne } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import {
  aiSynthesisVersions,
  children,
  diagnosis,
  diagnosis_question_table,
  patientSessions,
  response_table,
  response_to_question_table,
} from '../db/schema';
import { authenticateToken, type AuthRequest } from '../middleware/auth.middleware';
import { computeTriageScore } from '../services/triage.service';

export const diagnosisRouter = Router();

const priorityLabels: Record<string, string> = {
  non_urgent: 'Non urgent',
  a_surveiller: 'À surveiller',
  urgent: 'Urgent',
};

const worryLabels: Record<string, string> = {
  faible: 'Faible',
  modéré: 'Modéré',
  élevé: 'Élevé',
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTextValue = (value?: string | null) => {
  if (!value) return 'Non renseigné';
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : 'Non renseigné';
};

const normalizeList = (value?: string[] | null) => {
  if (!value || value.length === 0) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
};

type PDFDocumentType = InstanceType<typeof PDFDocument>;

const drawSectionSeparator = (doc: PDFDocumentType, color: string, left: number, right: number) => {
  doc
    .strokeColor(color)
    .lineWidth(0.6)
    .moveTo(left, doc.y)
    .lineTo(right, doc.y)
    .stroke();
};

export interface DiagnosisResponse {
  response_id: string
  nir?: string
  responses: {
    question_id: string
    proposition_id: string | null
    value: string
  }[]
}

const getAnswerByLabel = (
  answers: Record<string, string | string[]>,
  labelsByQuestionId: Map<string, string>,
  labelPattern: RegExp,
) => {
  const entry = Object.entries(answers)
    .find(([questionId]) => labelPattern.test(labelsByQuestionId.get(questionId) ?? ''));
  const value = entry?.[1];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
};

const getArrayAnswerByLabel = (
  answers: Record<string, string | string[]>,
  labelsByQuestionId: Map<string, string>,
  labelPattern: RegExp,
) => {
  const entry = Object.entries(answers)
    .find(([questionId]) => labelPattern.test(labelsByQuestionId.get(questionId) ?? ''));
  const value = entry?.[1];
  return Array.isArray(value) ? value : value ? [value] : [];
};

diagnosisRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data: DiagnosisResponse = req.body;

    if (!data.response_id || !Array.isArray(data.responses)) {
      return res.status(400).json({ error: 'Payload invalide' });
    }

    const [response] = await db.select()
      .from(response_table)
      .where(eq(response_table.id, data.response_id))
      .limit(1);

    if (!response?.diagnosis_id) {
      return res.status(404).json({ error: 'Réponse introuvable' });
    }

    const [record] = await db.select()
      .from(diagnosis)
      .where(eq(diagnosis.id, response.diagnosis_id))
      .limit(1);

    if (!record) {
      return res.status(404).json({ error: 'Formulaire introuvable' });
    }

    const questions = await db.select({
      id: diagnosis_question_table.id,
      label: diagnosis_question_table.question,
      type: diagnosis_question_table.type,
    })
      .from(diagnosis_question_table)
      .where(eq(diagnosis_question_table.diagnosis_id, record.id));

    const labelsByQuestionId = new Map(questions.map((q) => [q.id, q.label]));
    const typeByQuestionId = new Map(questions.map((q) => [q.id, q.type]));
    const validQuestionIds = new Set(labelsByQuestionId.keys());
    const invalidQuestion = data.responses.find((response) => !validQuestionIds.has(response.question_id));
    if (invalidQuestion) {
      return res.status(400).json({ error: 'Question invalide pour ce formulaire' });
    }

    const customAnswers = data.responses.reduce<Record<string, string | string[]>>((acc, response) => {
      const current = acc[response.question_id];
      if (current === undefined) {
        acc[response.question_id] = response.value;
      } else if (Array.isArray(current)) {
        current.push(response.value);
      } else {
        acc[response.question_id] = [current, response.value];
      }
      return acc;
    }, {});

    // Build label-keyed version for doctor dashboard display
    const labeledCustomAnswers: Record<string, string | string[]> = {};
    for (const [questionId, value] of Object.entries(customAnswers)) {
      const label = labelsByQuestionId.get(questionId);
      if (label) labeledCustomAnswers[label] = value;
    }

    // Extract structured fields from rich question types
    const getAnswerByType = (type: string): string | string[] | undefined => {
      const q = questions.find((q) => q.type === type);
      return q ? customAnswers[q.id] : undefined;
    };

    const symptomPickerAnswer = getAnswerByType('symptom_picker');
    const symptoms = Array.isArray(symptomPickerAnswer) ? symptomPickerAnswer : [];

    const timelineRaw = getAnswerByType('symptom_timeline');
    let symptomTimeline: Record<string, string> = {};
    if (typeof timelineRaw === 'string') {
      try { symptomTimeline = JSON.parse(timelineRaw); } catch {}
    }

    const allergyAnswer = getAnswerByType('allergy_picker');
    const allergies = Array.isArray(allergyAnswer) ? allergyAnswer : allergyAnswer ? [allergyAnswer] : [];

    const antecedentAnswer = getAnswerByType('antecedent_picker');
    const antecedents = Array.isArray(antecedentAnswer) ? antecedentAnswer : antecedentAnswer ? [antecedentAnswer] : [];

    const scaleAnswer = getAnswerByType('scale');
    const worryFromScale = typeof scaleAnswer === 'string' ? scaleAnswer : null;

    const childBirthDate = getAnswerByLabel(customAnswers, labelsByQuestionId, /naissance/i) || 'N/A';
    const triage = computeTriageScore({
      clinicalSigns: symptoms.length > 0 ? symptoms : getArrayAnswerByLabel(customAnswers, labelsByQuestionId, /signes cliniques/i),
      behaviorChanges: getArrayAnswerByLabel(customAnswers, labelsByQuestionId, /comportement/i),
      worryLevel: worryFromScale ?? getAnswerByLabel(customAnswers, labelsByQuestionId, /inquiétude/i),
      duration: Object.keys(symptomTimeline).length > 0
        ? Object.values(symptomTimeline)[0]
        : getAnswerByLabel(customAnswers, labelsByQuestionId, /combien de temps|durée|depuis/i),
      childBirthDate,
    });

    // Suppress unused variable warning — typeByQuestionId is available for future use
    void typeByQuestionId;

    await db.transaction(async tx => {
      await tx.update(response_table)
        .set({
          answeredAt: new Date(),
        })
        .where(eq(response_table.id, data.response_id));

      await tx.delete(response_to_question_table)
        .where(eq(response_to_question_table.response_id, data.response_id));

      const responseRows = data.responses.map((response) => ({
        ...response,
        response_id: data.response_id,
      }));

      if (responseRows.length) {
        await tx.insert(response_to_question_table).values(responseRows).returning();
      }

      const childFirstName = getAnswerByLabel(customAnswers, labelsByQuestionId, /prénom/i) || null;
      const childLastName = getAnswerByLabel(customAnswers, labelsByQuestionId, /^nom/i) || null;

      const genderRaw = getAnswerByLabel(customAnswers, labelsByQuestionId, /^genre$/i);
      const genderNormalized = genderRaw === 'Fille' ? 'fille' : genderRaw === 'Garçon' ? 'garcon' : genderRaw === 'Autre' ? 'autre' : genderRaw || null;

      const treatmentsRaw = getAnswerByLabel(customAnswers, labelsByQuestionId, /traitements/i) || null;

      let childId: string | null = record.childId ?? null;
      if (data.nir && record.doctorId) {
        const nir = data.nir.trim();
        const [existingChild] = await tx.select({ id: children.id })
          .from(children)
          .where(and(eq(children.nir, nir), eq(children.doctorId, record.doctorId)))
          .limit(1);

        if (existingChild) {
          childId = existingChild.id;
        } else {
          const [newChild] = await tx.insert(children).values({
            doctorId: record.doctorId,
            nir,
            firstName: childFirstName ?? '',
            lastName: childLastName ?? '',
            birthDate: childBirthDate !== 'N/A' ? childBirthDate : '',
          }).returning({ id: children.id });
          childId = newChild?.id ?? null;
        }
      }

      await tx.update(diagnosis)
        .set({
          childFirstName,
          childLastName,
          childBirthDate,
          nir: data.nir?.trim() || null,
          childId,
          gender: genderNormalized,
          treatments: treatmentsRaw,
          consultationReason: getAnswerByLabel(customAnswers, labelsByQuestionId, /motif/i) || null,
          symptoms: symptoms.length > 0 ? symptoms : undefined,
          symptomTimeline: Object.keys(symptomTimeline).length > 0 ? symptomTimeline : undefined,
          allergies: allergies.length > 0 ? allergies : undefined,
          antecedents: antecedents.length > 0 ? antecedents : undefined,
          behaviorChanges: getArrayAnswerByLabel(customAnswers, labelsByQuestionId, /comportement/i),
          clinicalSigns: getArrayAnswerByLabel(customAnswers, labelsByQuestionId, /signes cliniques/i),
          duration: getAnswerByLabel(customAnswers, labelsByQuestionId, /combien de temps|durée|depuis/i) || null,
          worryLevel: (worryFromScale ?? getAnswerByLabel(customAnswers, labelsByQuestionId, /inquiétude/i)) || null,
          actionsTaken: getArrayAnswerByLabel(customAnswers, labelsByQuestionId, /actions/i),
          additionalNotes: getAnswerByLabel(customAnswers, labelsByQuestionId, /complémentaires|message libre/i) || '',
          customAnswers: labeledCustomAnswers,
          status: 'new',
          triageLevel: triage.level,
        })
        .where(eq(diagnosis.id, record.id));

      if (record.sessionId) {
        await tx.update(patientSessions)
          .set({ status: 'completed' })
          .where(eq(patientSessions.id, record.sessionId));
      }
    });

    res.json({ success: true, id: record.id, response_id: data.response_id });
  } catch (error) {
    console.error("Détail de l'erreur", error);
    res.status(500).json({ error: "Erreur lors de l'enregistrement" });
  }
})

/**
 * Pediguide parent-flow payload (frontend → backend).
 * Old fields are kept optional so legacy submissions still parse.
 */
type DiagnosisPayload = {
  // Legacy fields
  childFirstName?: string;
  childLastName?: string;
  childBirthDate?: string;
  consultationReason?: string;
  behaviorChanges?: string[];
  clinicalSigns?: string[];
  duration?: string;
  worryLevel?: string;
  actionsTaken?: string[];
  additionalNotes?: string;

  // New Pediguide redesign fields
  weight?: string;
  height?: string;
  gender?: string;
  symptoms?: string[];
  symptomOther?: string;
  symptomTimeline?: Record<string, string>;
  symptomSeverity?: Record<string, number>;
  allergies?: string[];
  noAllergies?: boolean;
  treatments?: string;
  antecedents?: string[];
  noAntecedents?: boolean;
  vaccinations?: string;
  worry?: string;
  photoName?: string;
};

const getDoctorIdFromAuthorization = (req: Request) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  const jwtSecret = process.env.JWT_SECRET;

  if (!token || !jwtSecret) return null;

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id?: string };
    return decoded.id ?? null;
  } catch {
    return null;
  }
};

const getPatientToken = (req: Request) => {
  const headerToken = req.headers['x-patient-token'];
  const queryToken = req.query.token;
  const rawToken = Array.isArray(headerToken) ? headerToken[0] : headerToken || queryToken;
  return typeof rawToken === 'string' ? rawToken.trim() : '';
};

/**
 * Symptom-id → French label dictionary. Used by the PDF to render readable
 * names instead of raw chip ids ('sym-fever' → 'Fièvre').
 */
const SYMPTOM_LABELS: Record<string, string> = {
  'sym-fever': 'Fièvre',
  'sym-fatigue': 'Fatigue inhabituelle',
  'sym-appetite': "Perte d'appétit",
  'sym-irritability': 'Pleurs / irritabilité',
  'sym-sleep': 'Trouble du sommeil',
  'sym-cough': 'Toux',
  'sym-runny-nose': 'Nez qui coule',
  'sym-sore-throat': 'Mal de gorge',
  'sym-breathing': 'Difficulté à respirer',
  'sym-wheeze': 'Sifflement',
  'sym-vomiting': 'Vomissements',
  'sym-diarrhea': 'Diarrhée',
  'sym-belly': 'Mal au ventre',
  'sym-refuse-drink': 'Refuse de boire',
  'sym-constipation': 'Constipation',
  'sym-rash': 'Éruption / boutons',
  'sym-itching': 'Démangeaisons',
  'sym-ear': "Mal d'oreille",
  'sym-eye': 'Œil rouge ou collé',
};

const TIMELINE_LABELS: Record<string, string> = {
  'time-lt1h': "Moins d'une heure",
  'time-today': "Aujourd'hui",
  'time-yesterday': 'Hier',
  'time-2-3d': '2 à 3 jours',
  'time-week': 'Cette semaine',
  'time-gt-week': "Plus d'une semaine",
};

const ALLERGY_LABELS: Record<string, string> = {
  'allergy-peanut': 'Arachide',
  'allergy-milk': 'Lait de vache',
  'allergy-egg': 'Œuf',
  'allergy-nuts': 'Fruits à coque',
  'allergy-fish': 'Poisson',
  'allergy-penicillin': 'Pénicilline',
  'allergy-pollen': 'Pollen',
  'allergy-mites': 'Acariens',
};

const ANTECEDENT_LABELS: Record<string, string> = {
  'antec-asthma': 'Asthme',
  'antec-eczema': 'Eczéma',
  'antec-food-allergy': 'Allergie alimentaire',
  'antec-diabetes': 'Diabète',
  'antec-seizures': 'Convulsions fébriles',
  'antec-heart': 'Cardiopathie',
  'antec-preterm': 'Prématurité',
};

const GENDER_LABELS: Record<string, string> = {
  'fille': 'Fille',
  'garcon': 'Garçon',
  'autre': 'Autre',
};

const VACCINATIONS_LABELS: Record<string, string> = {
  'oui': 'À jour',
  'non': 'Pas à jour',
  'sais-pas': 'Ne sait pas',
};

const mapIds = (ids: string[] | null | undefined, dict: Record<string, string>) =>
  (ids ?? []).map((id) => dict[id] ?? id);

diagnosisRouter.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || '');

    if (!id) {
      return res.status(400).json({ error: 'Identifiant manquant' });
    }

    const results = await db.select().from(diagnosis).where(eq(diagnosis.id, id)).limit(1);
    const record = results[0];

    if (!record) {
      return res.status(404).json({ error: 'Diagnostic introuvable' });
    }

    const doctorId = getDoctorIdFromAuthorization(req);
    const isDoctorOwner = !!doctorId && !!record.doctorId && record.doctorId === doctorId;
    let isPatientSessionOwner = false;
    const patientToken = getPatientToken(req);

    if (patientToken && record.sessionId) {
      const [session] = await db.select({ id: patientSessions.id })
        .from(patientSessions)
        .where(and(eq(patientSessions.id, record.sessionId), eq(patientSessions.patientToken, patientToken)))
        .limit(1);
      isPatientSessionOwner = !!session;
    }

    if (!isDoctorOwner && !isPatientSessionOwner) {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const [latestSynthesisVersion] = await db.select().from(aiSynthesisVersions)
      .where(eq(aiSynthesisVersions.diagnosisId, id))
      .orderBy(desc(aiSynthesisVersions.version))
      .limit(1);

    const fileDate = formatDate(new Date());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pediguide-compte-rendu-${fileDate}.pdf"`);

    // Pediguide redesign colors
    const primaryBlue = '#0066CC';
    const darkInk = '#0F1B2D';
    const mutedGray = '#6B7280';
    const separatorGray = '#E1E5EA';

    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    doc.pipe(res);
    doc.info.Title = 'Pediguide - Compte rendu';

    const pageLeft = doc.page.margins.left;
    const pageRight = doc.page.width - doc.page.margins.right;
    const pageWidth = pageRight - pageLeft;
    const contentWidth = pageWidth;

    const addSectionTitle = (title: string) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor(darkInk)
        .text(title, pageLeft, doc.y, { width: contentWidth });
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(11).fillColor('#111111');
    };

    const addKeyValue = (label: string, value: string) => {
      doc.font('Helvetica-Bold').fillColor(darkInk);
      const labelText = `${label} `;
      const labelWidth = doc.widthOfString(labelText);
      doc.text(labelText, pageLeft, doc.y, { continued: true });
      doc.font('Helvetica').fillColor('#111111');
      doc.text(value, { width: Math.max(contentWidth - labelWidth, 50) });
      doc.moveDown(0.2);
    };

    const addBulletList = (label: string, items: string[]) => {
      const bulletIndent = 12;
      doc.font('Helvetica-Bold').fillColor(darkInk).text(label, pageLeft, doc.y, { width: contentWidth });
      if (items.length === 0) {
        doc.font('Helvetica').fillColor('#111111').text('Non renseigné', pageLeft, doc.y, { width: contentWidth });
      } else {
        items.forEach((item) => {
          doc
            .font('Helvetica')
            .fillColor('#111111')
            .text(`• ${item}`, pageLeft + bulletIndent, doc.y, { width: contentWidth - bulletIndent });
        });
      }
      doc.moveDown(0.2);
    };

    const addParagraph = (label: string, value?: string | null) => {
      doc.font('Helvetica-Bold').fillColor(darkInk).text(label, pageLeft, doc.y, { width: contentWidth });
      doc.font('Helvetica').fillColor('#111111').text(formatTextValue(value), pageLeft, doc.y, { width: contentWidth });
      doc.moveDown(0.2);
    };

    doc.font('Helvetica').fontSize(11).lineGap(2).fillColor('#111111');

    // Header
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(darkInk)
      .text('Pediguide - Compte rendu', pageLeft, doc.y, { width: pageWidth });
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor(darkInk)
      .text('Compte rendu pré-consultation', pageLeft, doc.y, { width: pageWidth });
    doc.moveDown(0.5);
    drawSectionSeparator(doc, primaryBlue, pageLeft, pageRight);
    doc.moveDown(0.6);

    const recordedDate = formatDate(record.createdAt ? new Date(record.createdAt) : new Date());
    addKeyValue('Identifiant :', record.id ?? id);
    addKeyValue('Date :', recordedDate);
    drawSectionSeparator(doc, separatorGray, pageLeft, pageRight);
    doc.moveDown(0.6);

    // Identité
    addSectionTitle('Identité');
    addKeyValue('Prénom :', formatTextValue(record.childFirstName));
    if (record.childLastName) addKeyValue('Nom :', formatTextValue(record.childLastName));
    addKeyValue('Date de naissance :', formatTextValue(record.childBirthDate));
    if (record.weight) addKeyValue('Poids :', `${record.weight} kg`);
    if (record.height) addKeyValue('Taille :', `${record.height} cm`);
    if (record.gender) addKeyValue('Genre :', GENDER_LABELS[record.gender] ?? record.gender);
    drawSectionSeparator(doc, separatorGray, pageLeft, pageRight);
    doc.moveDown(0.6);

    if (record.aiSynthesis) {
      addSectionTitle('Synthèse IA');
      if (latestSynthesisVersion) {
        addKeyValue('Version :', `v${latestSynthesisVersion.version} - ${formatDate(new Date(latestSynthesisVersion.createdAt ?? new Date()))}`);
        addKeyValue('Modèle :', latestSynthesisVersion.model);
        addKeyValue('Prompt :', latestSynthesisVersion.promptVersion);
      }
      addKeyValue('Priorité :', priorityLabels[record.aiSynthesis.niveau_priorite] ?? record.aiSynthesis.niveau_priorite);
      addKeyValue(
        "Niveau d'inquiétude parent :",
        worryLabels[record.aiSynthesis.niveau_inquietude_parent] ?? record.aiSynthesis.niveau_inquietude_parent,
      );
      addParagraph('Motif principal :', record.aiSynthesis.motif_principal);
      addBulletList('Symptômes clés :', normalizeList(record.aiSynthesis.symptomes_cles));
      addKeyValue("Durée d'évolution :", formatTextValue(record.aiSynthesis.duree_evolution));
      addBulletList('Actions déjà prises :', normalizeList(record.aiSynthesis.actions_deja_prises));
      addBulletList("Points d'attention :", normalizeList(record.aiSynthesis.points_attention));
      if (record.aiSynthesis.resume_message_libre) {
        addParagraph('Message complémentaire résumé :', record.aiSynthesis.resume_message_libre);
      }
      addParagraph('Disclaimer IA :', record.aiSynthesis.disclaimer);
      drawSectionSeparator(doc, separatorGray, pageLeft, pageRight);
      doc.moveDown(0.6);
    }

    // Symptômes & chronologie / intensité
    addSectionTitle('Symptômes');
    const symptomIds = (record.symptoms ?? []) as string[];
    const symptomTimeline = (record.symptomTimeline ?? {}) as Record<string, string>;
    const symptomSeverity = (record.symptomSeverity ?? {}) as Record<string, number>;

    if (symptomIds.length === 0 && !record.symptomOther) {
      doc.font('Helvetica').fillColor('#111111').text('Aucun symptôme sélectionné.', pageLeft, doc.y, { width: contentWidth });
      doc.moveDown(0.2);
    } else {
      symptomIds.forEach((id) => {
        const label = SYMPTOM_LABELS[id] ?? id;
        const since = symptomTimeline[id] ? (TIMELINE_LABELS[symptomTimeline[id]] ?? symptomTimeline[id]) : 'Non renseigné';
        const intensity = symptomSeverity[id] !== undefined ? `${symptomSeverity[id]}/10` : 'Non renseigné';
        doc.font('Helvetica-Bold').fillColor(darkInk)
          .text(`• ${label}`, pageLeft, doc.y, { width: contentWidth });
        doc.font('Helvetica').fillColor('#111111')
          .text(`   Depuis : ${since} — Intensité : ${intensity}`, pageLeft, doc.y, { width: contentWidth });
        doc.moveDown(0.1);
      });
      if (record.symptomOther) {
        doc.moveDown(0.1);
        addKeyValue('Autre :', formatTextValue(record.symptomOther));
      }
    }
    drawSectionSeparator(doc, separatorGray, pageLeft, pageRight);
    doc.moveDown(0.6);

    // Antécédents & allergies
    addSectionTitle('Antécédents & allergies');
    const allergies = record.noAllergies
      ? ['Aucune allergie connue']
      : mapIds((record.allergies ?? []) as string[], ALLERGY_LABELS);
    addBulletList('Allergies :', normalizeList(allergies));

    addKeyValue('Traitements en cours :', formatTextValue(record.treatments));

    const antecedents = record.noAntecedents
      ? ['Aucun antécédent particulier']
      : mapIds((record.antecedents ?? []) as string[], ANTECEDENT_LABELS);
    addBulletList('Antécédents médicaux :', normalizeList(antecedents));

    if (record.vaccinations) {
      addKeyValue('Vaccinations :', VACCINATIONS_LABELS[record.vaccinations] ?? record.vaccinations);
    }
    drawSectionSeparator(doc, separatorGray, pageLeft, pageRight);
    doc.moveDown(0.6);

    // Contexte
    addSectionTitle('Contexte');
    addKeyValue('Inquiétude principale :', formatTextValue(record.worry));
    addKeyValue('Autre contexte :', formatTextValue(record.additionalNotes));
    if (record.photoName) {
      addKeyValue('Photo jointe :', record.photoName);
    }

    const footerNote = 'Ce document est généré automatiquement à partir du questionnaire Pediguide de pré-consultation. Il ne remplace pas un avis médical.';
    const range = doc.bufferedPageRange();

    const startIndex = range.start || 0;
    for (let i = startIndex; i < startIndex + range.count; i += 1) {
      const pageNumber = i - startIndex + 1;
      doc.switchToPage(i);
      const currentLeft = doc.page.margins.left;
      const currentRight = doc.page.width - doc.page.margins.right;
      const currentWidth = currentRight - currentLeft;
      const footerHeight = 34;
      const footerY = doc.page.height - doc.page.margins.bottom - footerHeight;

      doc
        .strokeColor(separatorGray)
        .lineWidth(0.5)
        .moveTo(currentLeft, footerY)
        .lineTo(currentRight, footerY)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(mutedGray)
        .text(footerNote, currentLeft, footerY + 10, { width: currentWidth - 70, align: 'left' });

      if (range.count > 1) {
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(mutedGray)
          .text(`Page ${pageNumber}/${range.count}`, currentRight - 60, footerY + 10, { width: 60, align: 'right' });
      }
    }

    doc.end();
  } catch (error) {
    console.error("Détail de l'erreur", error);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
});

diagnosisRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.user?.id;

    // All diagnosis records (completed + in_progress), excluding templates
    const diagnosisList = await db.select().from(diagnosis)
      .leftJoin(patientSessions, eq(diagnosis.sessionId, patientSessions.id))
      .where(and(
        eq(diagnosis.doctorId, doctorId!),
        ne(diagnosis.status, 'template'),
      ))
      .orderBy(desc(diagnosis.createdAt));

    // Session IDs already covered by a diagnosis record
    const coveredSessionIds = new Set(
      diagnosisList.map(({ patient_sessions: s }) => s?.id).filter(Boolean),
    );

    // Sessions that were sent but never opened (no diagnosis at all)
    const allSessions = await db.select().from(patientSessions)
      .where(eq(patientSessions.doctorId, doctorId!));

    const unlinkedSessions = allSessions.filter(s => !coveredSessionIds.has(s.id));

    const resolveDisplayStatus = (status: string | null) => {
      if (!status || status === 'new') return 'completed';
      if (status === 'pending_response') return 'in_progress';
      return 'completed';
    };

    const diagnosisItems = diagnosisList.map(({ formulaires: d, patient_sessions: s }) => {
      const hasName = d.childFirstName && d.childFirstName !== 'N/A';
      return {
        ...d,
        childFirstName: hasName ? d.childFirstName : (s?.patientFirstName ?? d.childFirstName),
        patientEmail: s?.patientEmail ?? null,
        displayStatus: resolveDisplayStatus(d.status),
        _isSessionOnly: false,
      };
    });

    const sessionItems = unlinkedSessions.map(s => ({
      id: s.id,
      createdAt: s.createdAt,
      childFirstName: s.patientFirstName ?? null,
      childLastName: null,
      childBirthDate: null,
      consultationReason: null,
      worry: null,
      status: 'session_pending',
      triageLevel: null,
      triageScore: null,
      aiSynthesis: null,
      sessionId: s.id,
      doctorId: s.doctorId,
      formTemplateId: s.formTemplateId ?? null,
      customAnswers: null,
      childId: null,
      nir: null,
      patientEmail: s.patientEmail ?? null,
      displayStatus: 'pending' as const,
      _isSessionOnly: true,
    }));

    const combined = [...diagnosisItems, ...sessionItems].sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
    );

    res.json(combined);
  } catch (error) {
    console.error("Détail de l'erreur", error);
    res.status(500).json({ error: 'Erreur lecture base de données' });
  }
});
