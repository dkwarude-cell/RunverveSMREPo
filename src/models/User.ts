export type ProfileType = 'runner' | 'coach' | 'wellness';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';

export interface User {
  id: string;
  name: string;
  displayName?: string;
  photoURL?: string;
  email: string;
  profileType: ProfileType;
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: Gender;
  activityLevel: ActivityLevel;
  interests: string[];
  onboardingComplete: boolean;
  avatarUrl?: string;
  totalSessions?: number;
  streak?: number;
  level?: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  pushNotifications: boolean;
  sessionReminders: boolean;
  achievementNotifications: boolean;
  reminderTime: string; // HH:mm
  voiceCommandsEnabled: boolean;
  voiceFeedbackEnabled: boolean;
  wakeWordDetection: boolean;
  aiPlacementGuidance: boolean;
  themeMode: 'light' | 'dark' | 'auto';
  language: string;
  units: 'metric' | 'imperial';
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  pushNotifications: true,
  sessionReminders: true,
  achievementNotifications: true,
  reminderTime: '09:00',
  voiceCommandsEnabled: false,
  voiceFeedbackEnabled: false,
  wakeWordDetection: false,
  aiPlacementGuidance: true,
  themeMode: 'light',
  language: 'en',
  units: 'metric',
};
