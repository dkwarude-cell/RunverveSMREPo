/**
 * authService.ts - calls to the SmartHeal backend for sign-up OTP, password reset and the user profile.
 * (Endpoints are unchanged - see Backend/src/routes.)
 */
import apiClient, { apiErrorMessage } from './apiClient';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type Severity = 'Low' | 'Medium' | 'High';

export interface UserSettings {
  darkMode?: boolean;
  aiWarmUp?: boolean;
  units?: 'metric';
  tourDone?: boolean; // first-visit app tour finished or skipped
}

export interface UserProfileData {
  uid?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  age?: number;
  gender?: Gender;
  activityLevel?: ActivityLevel;
  weightKg?: number;
  heightCm?: number;
  conditions?: string[];
  severity?: Record<string, Severity>;
  subtypes?: Record<string, string | undefined>;
  goals?: string[];
  onboardingComplete?: boolean;
  settings?: UserSettings;
}

const auth = (idToken: string) => ({ headers: { Authorization: `Bearer ${idToken}` } });

export const AuthService = {
  async getProfile(idToken: string): Promise<UserProfileData> {
    const response = await apiClient.get('/users/profile', auth(idToken));
    return response.data?.user ?? {};
  },

  async saveProfile(idToken: string, profileData: UserProfileData) {
    const response = await apiClient.post('/users/profile', profileData, auth(idToken));
    return response.data;
  },

  async sendRegistrationOTP(data: { email: string; fullName: string; phone: string }) {
    try {
      const response = await apiClient.post('/sendRegistrationOTP', data);
      return response.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Failed to send OTP'));
    }
  },

  async registerWithOTP(data: { email: string; password: string; otp: string; fullName: string; phone: string }) {
    try {
      const response = await apiClient.post('/registerWithOTP', data);
      return response.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Registration failed'));
    }
  },

  async sendPasswordResetOTP(email: string) {
    try {
      const response = await apiClient.post('/sendOTP', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Failed to send OTP'));
    }
  },

  async verifyPasswordResetOTP(email: string, otp: string) {
    try {
      const response = await apiClient.post('/verifyotp', { email, otp });
      return response.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Invalid or expired OTP'));
    }
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    try {
      const response = await apiClient.post('/changepassword', { email, otp, newPassword });
      return response.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Failed to reset password'));
    }
  },
};
