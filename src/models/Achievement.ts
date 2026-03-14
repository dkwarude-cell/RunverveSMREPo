export type AchievementType = 'milestone' | 'consistency' | 'intensity' | 'duration' | 'exploration';

export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  title: string;
  name?: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  progress: number; // 0–100
  target: number;
  current: number;
}

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'id' | 'userId' | 'unlockedAt' | 'progress' | 'current'>[] = [
  // Milestones
  { type: 'milestone', title: 'First Step', description: 'Complete your first session', icon: '🏁', target: 1 },
  { type: 'milestone', title: 'Getting Started', description: 'Complete 10 sessions', icon: '⭐', target: 10 },
  { type: 'milestone', title: 'Dedicated', description: 'Complete 50 sessions', icon: '🏆', target: 50 },
  { type: 'milestone', title: 'Master Healer', description: 'Complete 100 sessions', icon: '👑', target: 100 },
  // Consistency
  { type: 'consistency', title: 'Getting Regular', description: '3-day streak', icon: '🔥', target: 3 },
  { type: 'consistency', title: 'Weekly Warrior', description: '7-day streak', icon: '💪', target: 7 },
  { type: 'consistency', title: 'Monthly Champion', description: '30-day streak', icon: '🏅', target: 30 },
  // Intensity
  { type: 'intensity', title: 'High Power', description: 'Reach intensity level 8', icon: '⚡', target: 8 },
  { type: 'intensity', title: 'Pro User', description: 'Complete 10 Pro mode sessions', icon: '🎯', target: 10 },
  // Duration
  { type: 'duration', title: 'Long Session', description: 'Complete a 30-minute session', icon: '⏱️', target: 30 },
  { type: 'duration', title: 'Marathon Session', description: 'Complete a 60-minute session', icon: '🕐', target: 60 },
  // Exploration
  { type: 'exploration', title: 'Explorer', description: 'Treat all body areas', icon: '🗺️', target: 13 },
];
