import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, SessionStatistics, SessionFilters, BodyArea } from '../../models/Session';

const SESSIONS_KEY = '@smartheal_sessions';

export async function saveSessionLocally(session: Session): Promise<void> {
  const existing = await getLocalSessions();
  existing.unshift(session);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(existing));
}

export async function getLocalSessions(): Promise<Session[]> {
  const data = await AsyncStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function getRecentSessions(limit = 5): Promise<Session[]> {
  const sessions = await getLocalSessions();
  return sessions.slice(0, limit);
}

export async function getFilteredSessions(filters?: SessionFilters): Promise<Session[]> {
  let sessions = await getLocalSessions();
  if (filters?.bodyArea) sessions = sessions.filter((s) => s.bodyArea === filters.bodyArea);
  if (filters?.mode) sessions = sessions.filter((s) => s.mode === filters.mode);
  if (filters?.dateFrom) sessions = sessions.filter((s) => s.startTime >= filters.dateFrom!);
  if (filters?.dateTo) sessions = sessions.filter((s) => s.startTime <= filters.dateTo!);
  return sessions;
}

export async function getStatistics(): Promise<SessionStatistics> {
  const sessions = await getLocalSessions();
  const completed = sessions.filter((s) => s.completed);

  const bodyAreaCounts: Record<string, number> = {};
  completed.forEach((s) => {
    bodyAreaCounts[s.bodyArea] = (bodyAreaCounts[s.bodyArea] || 0) + 1;
  });

  const mostTreated = Object.entries(bodyAreaCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    totalSessions: completed.length,
    totalTreatmentTime: completed.reduce((sum, s) => sum + s.duration, 0),
    mostTreatedBodyArea: (mostTreated?.[0] as BodyArea) ?? null,
    averageSessionDuration:
      completed.length > 0 ? completed.reduce((sum, s) => sum + s.duration, 0) / completed.length : 0,
    averageIntensity:
      completed.length > 0
        ? completed.reduce((sum, s) => sum + s.intensity, 0) / completed.length
        : 0,
    currentStreak: calculateStreak(completed),
  };
}

function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const dayMs = 86400000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;

  for (let i = 0; i <= 365; i++) {
    const target = today.getTime() - i * dayMs;
    const nextDay = target + dayMs;
    const hasSession = sessions.some((s) => s.startTime >= target && s.startTime < nextDay);
    if (hasSession) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}
