import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { desc, eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { aiSynthesisVersions, diagnosis, patientSessions } from '../db/schema';
import { authenticateToken, type AuthRequest } from '../middleware/auth.middleware';

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

diagnosisRouter.post('/', async (req: Request, res: Response) => {
  res.status(410).json({
    error: 'Ce formulaire public est désactivé. Utilisez un lien de session patient envoyé par un médecin.',
  });
});

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

    const primaryTeal = '#4A9B8E';
    const darkContrast = '#182245';
    const mutedGray = '#6B7280';
    const separatorGray = '#D6E1DF';

    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    doc.pipe(res);
    doc.info.Title = 'PediGuide - Compte rendu';

    const pageLeft = doc.page.margins.left;
    const pageRight = doc.page.width - doc.page.margins.right;
    const pageWidth = pageRight - pageLeft;
    const contentWidth = pageWidth;

    const addSectionTitle = (title: string) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor(darkContrast)
        .text(title, pageLeft, doc.y, { width: contentWidth });
      doc.moveDown(0.25);
      doc.font('Helvetica').fontSize(11).fillColor('#111111');
    };

    const addKeyValue = (label: string, value: string) => {
      doc.font('Helvetica-Bold').fillColor(darkContrast);
      const labelText = `${label} `;
      const labelWidth = doc.widthOfString(labelText);
      doc.text(labelText, pageLeft, doc.y, { continued: true });
      doc.font('Helvetica').fillColor('#111111');
      doc.text(value, { width: Math.max(contentWidth - labelWidth, 50) });
      doc.moveDown(0.2);
    };

    const addBulletList = (label: string, items: string[]) => {
      const bulletIndent = 12;
      doc.font('Helvetica-Bold').fillColor(darkContrast).text(label, pageLeft, doc.y, { width: contentWidth });
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
      doc.font('Helvetica-Bold').fillColor(darkContrast).text(label, pageLeft, doc.y, { width: contentWidth });
      doc.font('Helvetica').fillColor('#111111').text(formatTextValue(value), pageLeft, doc.y, { width: contentWidth });
      doc.moveDown(0.2);
    };

    doc.font('Helvetica').fontSize(11).lineGap(2).fillColor('#111111');

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(darkContrast)
      .text('PediGuide - Compte rendu', pageLeft, doc.y, { width: pageWidth });
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor(darkContrast)
      .text('Compte rendu pré-consultation', pageLeft, doc.y, { width: pageWidth });
    doc.moveDown(0.5);
    drawSectionSeparator(doc, primaryTeal, pageLeft, pageRight);
    doc.moveDown(0.6);

    const recordedDate = formatDate(record.createdAt ? new Date(record.createdAt) : new Date());
    addKeyValue('Identifiant :', record.id ?? id);
    addKeyValue('Date :', recordedDate);
    drawSectionSeparator(doc, separatorGray, pageLeft, pageRight);
    doc.moveDown(0.6);

    addSectionTitle('Informations patient');
    addKeyValue('Prénom :', formatTextValue(record.childFirstName));
    addKeyValue('Nom :', formatTextValue(record.childLastName));
    addKeyValue('Date de naissance :', formatTextValue(record.childBirthDate));
    addKeyValue('Motif de consultation :', formatTextValue(record.consultationReason));
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

    addSectionTitle('Observations');
    addBulletList('Changements de comportement :', normalizeList(record.behaviorChanges as string[] | null));
    addBulletList('Signes cliniques :', normalizeList(record.clinicalSigns as string[] | null));
    addKeyValue('Durée des symptômes :', formatTextValue(record.duration));
    addKeyValue("Niveau d'inquiétude :", formatTextValue(record.worryLevel));
    drawSectionSeparator(doc, separatorGray, pageLeft, pageRight);
    doc.moveDown(0.6);

    addSectionTitle('Actions et notes');
    addBulletList('Actions entreprises :', normalizeList(record.actionsTaken as string[] | null));
    addKeyValue('Message complémentaire :', formatTextValue(record.additionalNotes));

    const footerNote = 'Ce document est généré automatiquement à partir du questionnaire de pré-consultation et ne remplace pas un avis médical.';
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
    console.error("DÃ©tail de l'erreur", error);
    res.status(500).json({ error: "Erreur lors de la gÃ©nÃ©ration du PDF" });
  }
});

diagnosisRouter.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.user?.id;
    const list = await db.select().from(diagnosis)
      .where(eq(diagnosis.doctorId, doctorId!))
      .orderBy(desc(diagnosis.createdAt));
    res.json(list);
  } catch (error) {
    console.error("Détail de l'erreur", error);
    res.status(500).json({ error: "Erreur lecture base de données" });
  }
});
