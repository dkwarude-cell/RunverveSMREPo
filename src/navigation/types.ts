import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { SessionConfig } from '../models/Session';

// ─── Auth Stack ──────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  BiometricSetup: undefined;
};

// ─── Onboarding Stack ────────────────────────────────────
export type OnboardingStackParamList = {
  Welcome: undefined;
  ProfileTypeSelection: undefined;
  PersonalDetails: undefined;
  InterestsSelection: undefined;
  GoalSetting: undefined;
  OnboardingComplete: undefined;
};

// ─── Session Stack ───────────────────────────────────────
export type SessionStackParamList = {
  SessionConfig: undefined;
  AIPlacement: { config: SessionConfig };
  ActiveSession: { config: SessionConfig };
  SessionComplete: { config: SessionConfig; elapsedSeconds: number; intensity: number };
};

// ─── Device Stack ────────────────────────────────────────
export type DeviceStackParamList = {
  DevicesList: undefined;
  DeviceScan: undefined;
  DevicePairing: { deviceId: string };
  DeviceDetails: { deviceId: string };
};

// ─── Profile Stack ───────────────────────────────────────
export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Achievements: undefined;
  Goals: undefined;
  About: undefined;
  Help: undefined;
};

// ─── Main Bottom Tabs ────────────────────────────────────
export type MainTabParamList = {
  HomeTab: undefined;
  DevicesTab: undefined;
  SessionTab: undefined;
  HistoryTab: undefined;
  ProfileTab: undefined;
};

// ─── Root Navigator ──────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

// ─── Utility types ───────────────────────────────────────
export type AuthNavProp = StackNavigationProp<AuthStackParamList>;
export type OnboardingNavProp = StackNavigationProp<OnboardingStackParamList>;
export type SessionNavProp = StackNavigationProp<SessionStackParamList>;
export type DeviceNavProp = StackNavigationProp<DeviceStackParamList>;
export type ProfileNavProp = StackNavigationProp<ProfileStackParamList>;
