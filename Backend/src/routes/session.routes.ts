import express, { type Request, type Response } from 'express';
import authMiddleware from '../middleware/authmiddleware.js';
import { db, FieldValue } from '../config/firebase.js';

/**
 * Guided therapy sessions - stored per user in users/{uid}/sessions/{sessionId}.
 *   POST /api/sessions   save a finished (or stopped) session
 *   GET  /api/sessions   recent sessions, newest first (for Stats / Home later)
 */
const router = express.Router();

const sessionsOf = (uid: string) => db.collection('users').doc(uid).collection('sessions');
const THERAPIES = ['heat', 'vibration', 'tens'];
const num = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// SAVE SESSION
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const body = req.body ?? {};
    const therapies = Array.isArray(body.therapies)
      ? body.therapies
          .filter((t: any) => THERAPIES.includes(t?.type))
          .map((t: any) => ({
            type: t.type,
            plannedMin: num(t.plannedMin) ?? 0,
            completedMin: num(t.completedMin) ?? 0,
            settings: t.settings && typeof t.settings === 'object' ? t.settings : {},
          }))
      : [];
    if (!therapies.length) return res.status(400).json({ message: 'Session has no therapies' });

    const ref = await sessionsOf(uid).add({
      createdAt: FieldValue.serverTimestamp(),
      startedAt: typeof body.startedAt === 'string' ? body.startedAt : null,
      reportId: typeof body.reportId === 'string' ? body.reportId : null,
      bodyPart: typeof body.bodyPart === 'string' ? body.bodyPart : null,
      durationMin: num(body.durationMin) ?? 0,
      endedEarly: body.endedEarly === true,
      painBefore: num(body.painBefore),
      painAfter: num(body.painAfter),
      therapies,
    });
    console.log(`✅ Session ${ref.id} saved for UID: ${uid}`);
    return res.status(201).json({ message: 'Session saved', id: ref.id });
  } catch (error) {
    console.error('Save session error:', error);
    return res.status(500).json({ message: 'Failed to save session' });
  }
});

// LIST SESSIONS
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const snap = await sessionsOf(uid).orderBy('createdAt', 'desc').limit(100).get();
    const sessions = snap.docs.map(d => {
      const data = d.data();
      const created = data.createdAt;
      return { id: d.id, ...data, createdAt: created && typeof created.toDate === 'function' ? created.toDate().toISOString() : null };
    });
    return res.status(200).json({ sessions });
  } catch (error) {
    console.error('List sessions error:', error);
    return res.status(500).json({ message: 'Failed to load sessions' });
  }
});

export default router;
