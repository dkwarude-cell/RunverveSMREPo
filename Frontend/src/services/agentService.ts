/**
 * agent.ts - talks to the SmartHeal backend on Cloud Run.
 *
 * POST /analyze (multipart/form-data): photo + 10 user values
 *  -> ResNet50 (body part, wound) + Random Forest (therapy) + Gemini agent (verification)
 */

// ─────────── CONFIG ───────────
export const API_URL = 'https://smartheal-agent-6060358211.us-west1.run.app';
const TIMEOUT_MS = 120_000; // first request after idle can take ~30-40 s (cold start)

// ─────────── TYPES ───────────
export interface PatientInputs {
  age: number;
  bmi: number;
  body_fat_percent: number;
  skin_temperature_c: number;
  diabetic: 0 | 1;
  pain_level: number;
  pain_duration_weeks: number;
  neuropathic_score: number;
  stiffness_level: number;
  muscle_spasm_level: number;
}

export interface PickedImage {
  uri: string;
  type?: string;
  fileName?: string;
  base64?: string; // kept so the saved report can include a thumbnail
}

export interface Prediction {
  label: string;
  confidence: number;
  top3: { label: string; confidence: number }[];
}

export interface TherapyModel {
  Heat_Setting: string;
  Heat_Temperature_C: number;
  Heat_Duration_Min: number;
  Vibration_Frequency_Hz: number;
  Vibration_Amplitude_mm: number;
  Vibration_Pattern: string;
  Vibration_Duration_Min: number;
  TENS_Mode: string;
  TENS_Frequency_Hz: number;
  TENS_Pulse_Width_us: number;
  TENS_Intensity: string;
  TENS_Duration_Min: number;
  TENS_Electrode_Placement: string;
}

export interface AnalyzeResponse {
  analysis: string;
  cnn: { body_part: Prediction; wound: Prediction };
  /** Human-readable summary of what the user marked on the body map. */
  confirmed_body_part?: string;
  /** The raw body-map selection, kept so therapy limits can be applied per region. */
  body_selections?: { regionId: string; injuryIds: string[] }[];
  therapy_model: TherapyModel;
  safety_adjustments: string[];
  inputs: Record<string, number>;
  timing_ms: { models: number; agent: number };
}

// ─────────── HELPERS ───────────
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function readableError(status: number, body: any): string {
  const detail = body?.detail;
  if (Array.isArray(detail)) {
    // FastAPI validation error: [{loc: ['body','age'], msg: '...'}]
    const fields = detail.map((d: any) => `${d?.loc?.[d.loc.length - 1] ?? 'field'}: ${d?.msg ?? 'invalid'}`);
    return `Some values are not valid:\n${fields.join('\n')}`;
  }
  if (typeof detail === 'string') return detail;
  if (status === 0) return 'No internet connection.';
  return `Server error (${status}). Please try again.`;
}

// ─────────── MAIN ───────────
export async function analyzeSmartHeal(image: PickedImage, inputs: PatientInputs): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append('image', {
    uri: image.uri,
    type: image.type || 'image/jpeg',
    name: image.fileName || 'photo.jpg',
  } as any);
  (Object.keys(inputs) as (keyof PatientInputs)[]).forEach(key => {
    form.append(key, String(inputs[key]));
  });

  let res: Response;
  try {
    // do not set Content-Type: React Native adds the multipart boundary itself
    res = await fetchWithTimeout(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: form,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('The analysis took too long. Please check your internet and try again.');
    }
    throw new Error('Could not reach the SmartHeal server. Please check your internet connection.');
  }

  const raw = await res.text();
  let body: any = null;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }

  if (!res.ok) throw new Error(readableError(res.status, body));
  if (!body?.analysis) throw new Error('The server returned an empty analysis. Please try again.');
  return body as AnalyzeResponse;
}

/** Wakes the Cloud Run service up (call when the app opens, so the first analysis is faster). */
export function warmUpServer(): void {
  fetchWithTimeout(`${API_URL}/`, { method: 'GET' }, 30_000).catch(() => {});
}
