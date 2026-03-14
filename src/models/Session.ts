export type SessionMode = 'pro' | 'guided';

export type SessionState = 'idle' | 'active' | 'paused' | 'stopped';

export type BodyArea =
  | 'lower_back'
  | 'upper_back'
  | 'neck'
  | 'shoulder_left'
  | 'shoulder_right'
  | 'elbow_left'
  | 'elbow_right'
  | 'knee_left'
  | 'knee_right'
  | 'ankle_left'
  | 'ankle_right'
  | 'hip_left'
  | 'hip_right';

export interface SessionConfig {
  bodyArea: BodyArea;
  duration: number; // minutes
  intensity: number; // 1-10
  mode: SessionMode;
  protocolId?: string;
}

export interface Session {
  id: string;
  userId: string;
  bodyArea: BodyArea;
  duration: number; // seconds (actual)
  plannedDuration: number; // seconds
  intensity: number;
  mode: SessionMode;
  startTime: number;
  endTime: number;
  rating?: number; // 1-5
  notes?: string;
  deviceId?: string;
  completed: boolean;
}

export interface ProtocolTemplate {
  id: string;
  name: string;
  description: string;
  bodyArea: BodyArea;
  duration: number; // minutes
  intensity: number;
  mode: SessionMode;
  category: 'pain_relief' | 'recovery' | 'acute_injury' | 'performance' | 'relaxation';
}

export interface SessionFilters {
  dateFrom?: number;
  dateTo?: number;
  startDate?: Date;
  endDate?: Date;
  bodyArea?: BodyArea;
  mode?: SessionMode;
}

export interface SessionStatistics {
  totalSessions: number;
  totalTreatmentTime: number; // seconds
  mostTreatedBodyArea: BodyArea | null;
  averageSessionDuration: number; // seconds
  averageIntensity: number;
  currentStreak: number; // consecutive days
}
