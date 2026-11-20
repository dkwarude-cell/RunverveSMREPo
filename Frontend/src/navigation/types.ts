/**
 * types.ts - every screen in the app and the params it receives.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ActivityLevel, Gender, Severity } from '../services/authService';
import type { TherapyModel } from '../services/agentService';

export type TabKey = 'home' | 'analysis' | 'device' | 'stats' | 'assistant';

export type BasicInfoParams = {
  age?: number;
  gender?: Gender;
  weightKg?: number;
  heightCm?: number;
  activityLevel?: ActivityLevel;
  conditions?: string[];
  severity?: Record<string, Severity>;
  subtypes?: Record<string, string | undefined>;
};

export type MedicalParams = BasicInfoParams & {
  conditions: string[];
  severity: Record<string, Severity>;
  subtypes: Record<string, string | undefined>;
};

export type RootStackParamList = {
  // start + auth
  Splash: undefined;
  Welcome: undefined;
  Login: { prefilledEmail?: string } | undefined;
  SignUp: undefined;
  VerifyOtp: { fullName: string; email: string; phone: string; password: string };

  // onboarding (only after sign-up)
  BasicInfo: undefined;
  MedicalHistory: BasicInfoParams;
  Goals: MedicalParams;
  Celebration: undefined;

  // app
  Main: { tab?: TabKey } | undefined;
  Profile: undefined;
  Settings: undefined;
  About: undefined;
  TherapySession: { therapy: TherapyModel; reportId: string | null; bodyPart: string | null; painBefore: number | null };
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
