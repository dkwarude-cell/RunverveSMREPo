import express, { type Request, type Response } from 'express';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import authMiddleware from '../middleware/authmiddleware.js';
import { db, FieldValue } from '../config/firebase.js';

/**
 * AI Scan reports - stored per user in users/{uid}/reports/{reportId}.
 *   POST   /api/reports          save a report (AI result + photo, photo is shrunk to thumbnails)
 *   GET    /api/reports          list (newest first, without the full result)
 *   GET    /api/reports/:id      one full report
 *   DELETE /api/reports/:id      delete
 *   GET    /api/reports/:id/pdf  printable PDF for a doctor ({ fileName, base64 })
 */
const router = express.Router();

const reportsOf = (uid: string) => db.collection('users').doc(uid).collection('reports');

const toIso = (value: any) => (value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value ?? null);

/** photo (base64) -> small JPEG thumbnails: 480 px for the report / PDF, 120 px for the list */
async function makeThumbnails(photoBase64?: string) {
  if (!photoBase64) return { photo: null, thumb: null };
  try {
    const input = Buffer.from(photoBase64, 'base64');
    const photo = await sharp(input).rotate().resize(480, 480, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer();
    const thumb = await sharp(input).rotate().resize(120, 120, { fit: 'cover' }).jpeg({ quality: 60 }).toBuffer();
    return { photo: photo.toString('base64'), thumb: thumb.toString('base64') };
  } catch (error) {
    console.warn('Could not read report photo:', error);
    return { photo: null, thumb: null };
  }
}

// SAVE REPORT
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { result, summary, photoBase64 } = req.body ?? {};
    if (!result || typeof result !== 'object' || !result.therapy_model) {
      return res.status(400).json({ message: 'Report data is missing' });
    }
    const { photo, thumb } = await makeThumbnails(photoBase64);
    const ref = await reportsOf(uid).add({
      createdAt: FieldValue.serverTimestamp(),
      summary: {
        bodyPart: String(summary?.bodyPart ?? result.cnn?.body_part?.label ?? ''),
        wound: String(summary?.wound ?? result.cnn?.wound?.label ?? ''),
        severity: summary?.severity ?? null,
      },
      result,
      photo,
      thumb,
    });
    console.log(`✅ Report ${ref.id} saved for UID: ${uid}`);
    return res.status(201).json({ message: 'Report saved', id: ref.id });
  } catch (error) {
    console.error('Save report error:', error);
    return res.status(500).json({ message: 'Failed to save report' });
  }
});

// LIST REPORTS
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const snap = await reportsOf(uid).orderBy('createdAt', 'desc').limit(100).select('createdAt', 'summary', 'thumb').get();
    const reports = snap.docs.map(d => ({ id: d.id, createdAt: toIso(d.get('createdAt')), summary: d.get('summary'), thumb: d.get('thumb') ?? null }));
    return res.status(200).json({ reports });
  } catch (error) {
    console.error('List reports error:', error);
    return res.status(500).json({ message: 'Failed to load reports' });
  }
});

// GET ONE REPORT
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const doc = await reportsOf(uid).doc(String(req.params.id)).get();
    if (!doc.exists) return res.status(404).json({ message: 'Report not found' });
    const data = doc.data() ?? {};
    return res.status(200).json({ report: { id: doc.id, createdAt: toIso(data.createdAt), summary: data.summary, result: data.result, photo: data.photo ?? null } });
  } catch (error) {
    console.error('Get report error:', error);
    return res.status(500).json({ message: 'Failed to load report' });
  }
});

// DELETE REPORT
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    await reportsOf(uid).doc(String(req.params.id)).delete();
    return res.status(200).json({ message: 'Report deleted' });
  } catch (error) {
    console.error('Delete report error:', error);
    return res.status(500).json({ message: 'Failed to delete report' });
  }
});

// ───────── PDF ─────────
const pretty = (label?: string) => (label ? label.replace(/_/g, ' ') : '-');
const pct = (n?: number) => (typeof n === 'number' ? `${Math.round(n * 100)}%` : '-');
const RED = '#E11D2E';
const GREY = '#555555';

/** "**bold**", "* item", "#" etc. -> plain lines that read well on paper */
const plainText = (md: string) =>
  md
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.replace(/\*\*/g, '').replace(/^#+\s*/, '').replace(/^\s*[*-]\s+/, '• ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function buildPdf(report: Record<string, any>, profile: Record<string, any>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: 'SmartHeal AI Scan Report' } });
    const chunks: Buffer[] = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const r = report.result ?? {};
    const t = r.therapy_model ?? {};
    const created = report.createdAt ? new Date(report.createdAt) : new Date();
    const width = doc.page.width - 96;

    const heading = (text: string) => {
      doc.x = 48;
      doc.moveDown(0.8).fillColor(RED).font('Helvetica-Bold').fontSize(13).text(text, 48);
      doc.moveTo(48, doc.y + 2).lineTo(48 + width, doc.y + 2).strokeColor('#DDDDDD').stroke();
      doc.moveDown(0.5).fillColor('black').font('Helvetica').fontSize(10.5);
    };
    const row = (label: string, value: string) => {
      const y = doc.y;
      doc.font('Helvetica-Bold').fillColor(GREY).text(label, 48, y, { width: 170 });
      doc.font('Helvetica').fillColor('black').text(value, 228, y, { width: width - 180 });
      doc.x = 48; // back to the left margin for whatever comes next
      doc.moveDown(0.25);
    };

    // title
    doc.fillColor(RED).font('Helvetica-Bold').fontSize(20).text('SmartHeal', { continued: true }).fillColor('black').text('  AI Scan Report');
    doc.font('Helvetica').fontSize(10).fillColor(GREY).text(`Generated ${created.toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}`);

    // patient
    heading('Patient');
    const top = doc.y;
    row('Name', profile.fullName || '-');
    row('Age', profile.age ? `${profile.age} years` : '-');
    row('Gender', profile.gender ? pretty(profile.gender).replace(/^\w/, c => c.toUpperCase()) : '-');
    row('Height / Weight', `${profile.heightCm ? `${profile.heightCm} cm` : '-'} / ${profile.weightKg ? `${profile.weightKg} kg` : '-'}`);
    if (r.inputs?.bmi) row('BMI', String(r.inputs.bmi));
    row('Medical conditions', profile.conditions?.length ? profile.conditions.join(', ') : 'None reported');
    const afterPatient = doc.y;
    if (report.photo) {
      try {
        doc.image(Buffer.from(report.photo, 'base64'), 48 + width - 130, top, { fit: [130, 130] });
      } catch {
        /* photo unreadable - leave it out */
      }
    }
    doc.x = 48;
    doc.y = Math.max(afterPatient, report.photo ? top + 135 : afterPatient);

    // pain profile (what the patient entered)
    heading('Reported pain');
    const inp = r.inputs ?? {};
    row('Pain level', inp.pain_level !== undefined ? `${inp.pain_level} / 10` : '-');
    row('Duration', inp.pain_duration_weeks !== undefined ? `${inp.pain_duration_weeks} weeks` : '-');
    row('Nerve-pain signs', inp.neuropathic_score !== undefined ? `${inp.neuropathic_score} / 3` : '-');
    row('Stiffness', inp.stiffness_level !== undefined ? `${inp.stiffness_level} / 10` : '-');
    row('Muscle spasm', inp.muscle_spasm_level !== undefined ? `${inp.muscle_spasm_level} / 10` : '-');

    // image models
    heading('Image analysis (ResNet50)');
    row('Body part', `${pretty(r.cnn?.body_part?.label)} (${pct(r.cnn?.body_part?.confidence)})`);
    row('Wound type', `${pretty(r.cnn?.wound?.label)} (${pct(r.cnn?.wound?.confidence)})`);
    if (report.summary?.severity) row('Severity (AI estimate)', pretty(String(report.summary.severity)).replace(/^\w/, c => c.toUpperCase()));

    // device settings
    heading('Recommended device settings');
    doc.font('Helvetica-Bold').fillColor('black').text('Heat therapy', 48);
    row('Setting / temperature', `${t.Heat_Setting ?? '-'} / ${t.Heat_Temperature_C ?? '-'} °C`);
    row('Session', `${t.Heat_Duration_Min ?? '-'} min`);
    doc.moveDown(0.3).font('Helvetica-Bold').fillColor('black').text('Vibration therapy', 48);
    row('Frequency / amplitude', `${t.Vibration_Frequency_Hz ?? '-'} Hz / ${t.Vibration_Amplitude_mm ?? '-'} mm`);
    row('Pattern', String(t.Vibration_Pattern ?? '-'));
    row('Session', `${t.Vibration_Duration_Min ?? '-'} min`);
    doc.moveDown(0.3).font('Helvetica-Bold').fillColor('black').text('TENS therapy', 48);
    row('Mode', String(t.TENS_Mode ?? '-'));
    row('Frequency / pulse width', `${t.TENS_Frequency_Hz ?? '-'} Hz / ${t.TENS_Pulse_Width_us ?? '-'} µs`);
    row('Intensity', pretty(t.TENS_Intensity));
    row('Session / placement', `${t.TENS_Duration_Min ?? '-'} min / ${pretty(t.TENS_Electrode_Placement)}`);
    if (r.safety_adjustments?.length) row('Safety rules applied', r.safety_adjustments.join('; '));

    // AI agent text
    if (r.analysis) {
      heading('AI assessment (Gemini)');
      doc.font('Helvetica').fontSize(10).fillColor('black').text(plainText(String(r.analysis)), 48, doc.y, { width, lineGap: 2 });
    }

    doc
      .moveDown(1.2)
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor(GREY)
      .text('This report was generated by the SmartHeal app using AI models. It is guidance only and is not a medical diagnosis. Please review together with a clinical examination.', 48, doc.y, { width });
    doc.end();
  });
}

router.get('/:id/pdf', authMiddleware, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const [reportDoc, userDoc] = await Promise.all([reportsOf(uid).doc(String(req.params.id)).get(), db.collection('users').doc(uid).get()]);
    if (!reportDoc.exists) return res.status(404).json({ message: 'Report not found' });
    const report = { ...reportDoc.data(), createdAt: toIso(reportDoc.get('createdAt')) };
    const pdf = await buildPdf(report, userDoc.data() ?? {});
    const date = (report.createdAt ? new Date(report.createdAt) : new Date()).toISOString().slice(0, 10);
    return res.status(200).json({ fileName: `SmartHeal-Report-${date}.pdf`, base64: pdf.toString('base64') });
  } catch (error) {
    console.error('Report PDF error:', error);
    return res.status(500).json({ message: 'Failed to create PDF' });
  }
});

export default router;
