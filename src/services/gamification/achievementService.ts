import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, ACHIEVEMENT_DEFINITIONS } from '../../models/Achievement';
import { generateId } from '../../utils/helpers';

const ACHIEVEMENTS_KEY = '@smartheal_achievements';

export async function getAchievements(): Promise<Achievement[]> {
  const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
  return data ? JSON.parse(data) : initializeAchievements();
}

function initializeAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    ...def,
    id: generateId(),
    userId: '',
    progress: 0,
    current: 0,
  }));
}

export async function saveAchievements(achievements: Achievement[]): Promise<void> {
  await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
}

export async function checkAndUpdateAchievements(
  totalSessions: number,
  currentStreak: number,
  maxIntensity: number,
  maxDuration: number, // minutes
  uniqueBodyAreas: number,
  proSessions: number,
): Promise<Achievement[]> {
  const achievements = await getAchievements();
  const unlocked: Achievement[] = [];

  for (const a of achievements) {
    if (a.unlockedAt) continue; // already unlocked

    let current = 0;
    switch (a.type) {
      case 'milestone':
        current = totalSessions;
        break;
      case 'consistency':
        current = currentStreak;
        break;
      case 'intensity':
        current = a.title === 'Pro User' ? proSessions : maxIntensity;
        break;
      case 'duration':
        current = maxDuration;
        break;
      case 'exploration':
        current = uniqueBodyAreas;
        break;
    }

    a.current = current;
    a.progress = Math.min(100, Math.round((current / a.target) * 100));

    if (current >= a.target && !a.unlockedAt) {
      a.unlockedAt = Date.now();
      unlocked.push(a);
    }
  }

  await saveAchievements(achievements);
  return unlocked;
}
