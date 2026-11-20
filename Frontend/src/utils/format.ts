import type { TherapyModel } from '../services/agentService';

export interface Row {
  label: string;
  value: string;
  hint?: string;
}

/** BMI from height (cm) and weight (kg). */
export function calcBmi(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg) return 0;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** Adult body-fat % estimate from BMI, age and sex (Deurenberg formula). */
export function estimateBodyFat(bmi: number, age: number, sex: 'Male' | 'Female'): number {
  const s = sex === 'Male' ? 1 : 0;
  const bf = 1.2 * bmi + 0.23 * age - 10.8 * s - 5.4;
  return Math.round(Math.min(55, Math.max(5, bf)) * 10) / 10;
}

export function bmiCategory(bmi: number): string {
  if (!bmi) return '';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function percent(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** Wound labels from the dataset -> readable text. */
export function prettyLabel(label: string): string {
  if (label === 'No_Wound') return 'No wound';
  if (label === 'Laseration') return 'Laceration';
  return label.replace(/_/g, ' ');
}

function vibrationBand(hz: number): string {
  if (hz <= 20) return 'Low band (5–20 Hz)';
  if (hz <= 50) return 'Mid band (20–50 Hz)';
  return 'High band / TVR (100–150 Hz)';
}

export function heatRows(t: TherapyModel): Row[] {
  return [
    { label: 'Setting', value: t.Heat_Setting },
    { label: 'Temperature', value: `${t.Heat_Temperature_C} °C` },
    { label: 'Session', value: `${t.Heat_Duration_Min} min` },
  ];
}

export function vibrationRows(t: TherapyModel): Row[] {
  return [
    { label: 'Frequency', value: `${t.Vibration_Frequency_Hz} Hz`, hint: vibrationBand(t.Vibration_Frequency_Hz) },
    {
      label: 'Amplitude',
      value: `${t.Vibration_Amplitude_mm} mm`,
      hint: t.Vibration_Amplitude_mm >= 1 ? 'High (deep tissue)' : 'Low (nerve pathways)',
    },
    { label: 'Pattern', value: t.Vibration_Pattern },
    { label: 'Session', value: `${t.Vibration_Duration_Min} min` },
  ];
}

export function tensRows(t: TherapyModel): Row[] {
  const burst = /burst/i.test(t.TENS_Mode);
  return [
    { label: 'Mode', value: burst ? 'Burst TENS' : t.TENS_Mode === 'Conventional' ? 'Conventional TENS' : t.TENS_Mode },
    { label: 'Frequency', value: burst ? `${t.TENS_Frequency_Hz} Hz (2–4 bursts/s)` : `${t.TENS_Frequency_Hz} Hz` },
    { label: 'Pulse width', value: `${t.TENS_Pulse_Width_us} µs` },
    { label: 'Intensity', value: t.TENS_Intensity },
    { label: 'Session', value: `${t.TENS_Duration_Min} min` },
    { label: 'Placement', value: t.TENS_Electrode_Placement },
  ];
}
