/**
 * profileOptions.ts - option lists used by onboarding and the profile screen.
 */
import type { ActivityLevel, Gender } from '../services/authService';

export const GENDERS: { value: Gender; label: string; icon: string }[] = [
  { value: 'male', label: 'Male', icon: 'gender-male' },
  { value: 'female', label: 'Female', icon: 'gender-female' },
  { value: 'other', label: 'Other', icon: 'gender-non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: 'eye-off-outline' },
];

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; detail: string; icon: string }[] = [
  { value: 'sedentary', label: 'Sedentary', detail: 'Little or no exercise', icon: 'sofa-outline' },
  { value: 'lightly_active', label: 'Lightly active', detail: 'Exercise 1–3 times a week', icon: 'walk' },
  { value: 'moderately_active', label: 'Moderately active', detail: 'Exercise 3–5 times a week', icon: 'run' },
  { value: 'very_active', label: 'Very active', detail: 'Training 6–7 times a week', icon: 'run-fast' },
];

export const CONDITIONS: { label: string; icon: string }[] = [
  { label: 'Diabetes', icon: 'water-outline' },
  { label: 'Hypertension', icon: 'heart-pulse' },
  { label: 'Heart Disease', icon: 'heart-outline' },
  { label: 'Arthritis', icon: 'bone' },
  { label: 'Back Pain', icon: 'human-handsdown' },
  { label: 'Knee Pain', icon: 'human-male' },
  { label: 'Chronic Pain', icon: 'lightning-bolt-outline' },
];

export const CONDITION_SUBTYPES: Record<string, string[]> = {
  Diabetes: ['Type 1', 'Type 2', 'Gestational', 'Prediabetes'],
  Hypertension: ['Primary', 'Secondary', 'Resistant', 'White-coat'],
  'Heart Disease': ['Coronary artery', 'Heart failure', 'Arrhythmia', 'Valve disease'],
  Arthritis: ['Osteoarthritis', 'Rheumatoid', 'Psoriatic', 'Gout'],
  'Back Pain': ['Acute', 'Chronic', 'Sciatica'],
  'Knee Pain': ['Meniscus', 'Ligament', 'Osteoarthritis', 'Patellofemoral'],
  'Chronic Pain': ['Neuropathic', 'Inflammatory', 'Nociceptive', 'Functional'],
};

export const GOALS: { label: string; icon: string }[] = [
  { label: 'Pain Relief', icon: 'medical-bag' },
  { label: 'Muscle Recovery', icon: 'arm-flex' },
  { label: 'Improved Mobility', icon: 'human-greeting' },
  { label: 'Stress Reduction', icon: 'meditation' },
  { label: 'Better Sleep', icon: 'moon-waning-crescent' },
  { label: 'General Wellness', icon: 'heart-plus-outline' },
];

export const genderLabel = (g?: string) => GENDERS.find(x => x.value === g)?.label ?? g ?? '';
export const activityLabel = (a?: string) => ACTIVITY_LEVELS.find(x => x.value === a)?.label ?? a ?? '';

export function bmiInfo(weightKg?: number | null, heightCm?: number | null) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  const value = Math.round((weightKg / (h * h)) * 10) / 10;
  if (!Number.isFinite(value)) return null;
  const label = value < 18.5 ? 'Underweight' : value < 25 ? 'Healthy' : value < 30 ? 'Overweight' : 'Obese';
  return { value, label };
}
