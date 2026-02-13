export interface Goal {
  id: string;
  userId: string;
  title: string;
  goalType: 'pain_reduction' | 'recovery' | 'performance' | 'consistency' | 'custom';
  targetDate: number;
  currentPainLevel: number; // 0–10
  targetPainLevel: number; // 0–10
  sessionsPerWeek: number;
  progress: number; // 0–100
  status: 'on_track' | 'behind' | 'completed';
  createdAt: number;
  updatedAt: number;
}
