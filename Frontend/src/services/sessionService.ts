/**
 * sessionService.ts - guided therapy sessions (Backend: /api/sessions, stored in Firestore users/{uid}/sessions).
 */
import { getAuth } from '@react-native-firebase/auth';
import apiClient, { apiErrorMessage } from './apiClient';
import type { Therapy } from '../data/sampleStats';

export type SessionTherapy = { type: Therapy; plannedMin: number; completedMin: number; settings: Record<string, string | number> };

export type SessionData = {
  startedAt: string;
  reportId: string | null;
  bodyPart: string | null;
  durationMin: number;
  endedEarly: boolean;
  painBefore: number | null;
  painAfter: number | null;
  therapies: SessionTherapy[];
};

export const SessionService = {
  async save(data: SessionData): Promise<string> {
    const current = getAuth().currentUser;
    if (!current) throw new Error('You are not logged in.');
    try {
      const res = await apiClient.post('/sessions', data, { headers: { Authorization: `Bearer ${await current.getIdToken()}` } });
      return res.data.id;
    } catch (e) {
      throw new Error(apiErrorMessage(e, 'Could not save the session'));
    }
  },
};
