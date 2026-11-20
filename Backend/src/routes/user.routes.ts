import express, { type Request, type Response } from 'express';
import authMiddleware from '../middleware/authmiddleware.js';
import { db, FieldValue } from '../config/firebase.js';

const router = express.Router();

/** Firestore timestamps -> ISO strings so the app gets plain JSON */
const toPlain = (data: Record<string, any>) => {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = value && typeof value.toDate === 'function' ? value.toDate().toISOString() : value;
  }
  return out;
};

// GET PROFILE - returns the saved profile (creates a basic one on first login)
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const uid = user.uid;
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      console.log(`User ${uid} not found in 'smartheal' DB. Creating basic profile...`);
      const newProfile = {
        uid,
        email: user.email || '',
        fullName: user.name || '', // Google accounts include a name
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      await userRef.set(newProfile);
      return res.status(200).json({
        message: 'Profile initialized successfully',
        user: { uid, email: newProfile.email, fullName: newProfile.fullName },
      });
    }

    return res.status(200).json({
      message: 'Profile fetched successfully',
      user: { ...toPlain(doc.data() ?? {}), uid, email: user.email || doc.data()?.email || '' },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// CREATE / UPDATE PROFILE - only the fields that are sent are changed (merge)
router.post('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const uid = user.uid;
    const body = req.body ?? {};

    const allowed = [
      'fullName',
      'phone',
      'age',
      'gender',
      'activityLevel',
      'weightKg',
      'heightCm',
      'conditions',
      'severity',
      'subtypes',
      'goals',
      'onboardingComplete',
      'settings',
    ];

    const profileData: Record<string, any> = { uid, email: user.email, updatedAt: FieldValue.serverTimestamp() };
    for (const key of allowed) {
      if (body[key] !== undefined) profileData[key] = body[key];
    }
    if (profileData.age !== undefined && profileData.age !== null) profileData.age = Number(profileData.age);

    await db.collection('users').doc(uid).set(profileData, { merge: true });
    console.log(`✅ Profile saved to 'smartheal' DB for UID: ${uid}`);

    const saved = { ...profileData };
    delete saved.updatedAt;
    return res.status(201).json({ message: 'Profile saved successfully', user: { profileData: saved } });
  } catch (error) {
    console.error('Create profile error:', error);
    return res.status(500).json({ message: 'Failed to save profile' });
  }
});

export default router;
