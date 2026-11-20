/**
 * therapyPlan - turns the AI's therapy model plus the chosen body area into what the
 * device may actually do.
 *
 * The model returns one plan for the whole body; the area it is applied to decides whether
 * that plan is safe. TENS across a throat or a chest with a pacemaker is not the same
 * request as TENS on a calf, so every limit in data/bodyMap is enforced here, before any
 * output is driven. Each change is recorded so the session can tell the user what differs
 * from the plan they were shown.
 */
import { TherapyModel } from '../agentService';
import { BodySelection, regionById } from '../../data/bodyMap';

/** Coin motors on the patch, numbered left to right, top to bottom in a 4x4 grid. */
const ALL_MOTORS = Array.from({ length: 16 }, (_, i) => i + 1);
const MIDDLE_MOTORS = [5, 6, 7, 8, 9, 10, 11, 12];
const CENTRE_MOTORS = [6, 7, 10, 11];

/** How much of the patch realistically sits on each area. */
const COVERAGE: Record<string, number[]> = {
  head: CENTRE_MOTORS,
  neck_front: CENTRE_MOTORS,
  neck_back: CENTRE_MOTORS,
  elbow: CENTRE_MOTORS,
  forearm: CENTRE_MOTORS,
  knee: CENTRE_MOTORS,
  foot: CENTRE_MOTORS,
  heel: CENTRE_MOTORS,
  shoulder: MIDDLE_MOTORS,
  shoulder_blade: MIDDLE_MOTORS,
  upper_arm: MIDDLE_MOTORS,
  hip: MIDDLE_MOTORS,
  shin: MIDDLE_MOTORS,
  calf: MIDDLE_MOTORS,
  glute: MIDDLE_MOTORS,
};

const coverageFor = (regionId: string) =>
  COVERAGE[regionId] ?? COVERAGE[regionId.replace(/_[lr]$/, '')] ?? ALL_MOTORS;

export type AdaptedPlan = {
  heat: { targetC: number; minutes: number };
  vibration: { intensityPct: number; motors: number[]; pulsed: boolean; minutes: number };
  tens: { allowed: boolean; minutes: number; note?: string };
  /** Plain sentences describing every change made to the model's plan. */
  adjustments: string[];
  /** Safety notes worth showing even when nothing was changed. */
  notes: string[];
};

/** Frequency sets how hard the motors run; a high amplitude plan adds a little more. */
function vibrationIntensity(model: TherapyModel): number {
  const hz = Number(model.Vibration_Frequency_Hz) || 0;
  const mm = Number(model.Vibration_Amplitude_mm) || 0;
  let intensity = Math.round(Math.max(35, Math.min(100, (hz / 150) * 100)));
  if (mm >= 1) intensity = Math.min(100, intensity + 15);
  return intensity;
}

export function adaptTherapyForBody(
  model: TherapyModel,
  selections: BodySelection[],
): AdaptedPlan {
  const adjustments: string[] = [];
  const notes: string[] = [];

  const regions = selections
    .map(selection => regionById(selection.regionId))
    .filter((region): region is NonNullable<typeof region> => Boolean(region));

  let targetC = Number(model.Heat_Temperature_C) || 38;
  let intensityPct = vibrationIntensity(model);
  let tensAllowed = true;
  let tensNote: string | undefined;

  // Motors are the union of what each chosen area can carry: treating two areas means the
  // patch is moved between them, not that the overlap is all that may run.
  const motorSet = new Set<number>();

  for (const region of regions) {
    const rules = region.therapy;
    coverageFor(region.id).forEach(motor => motorSet.add(motor));

    if (rules.maxHeatC != null && targetC > rules.maxHeatC) {
      adjustments.push(
        `Heat lowered from ${targetC}°C to ${rules.maxHeatC}°C for the ${region.label.toLowerCase()}.`,
      );
      targetC = rules.maxHeatC;
    }
    if (rules.maxVibrationPct != null && intensityPct > rules.maxVibrationPct) {
      adjustments.push(
        `Vibration reduced to ${rules.maxVibrationPct}% for the ${region.label.toLowerCase()}.`,
      );
      intensityPct = rules.maxVibrationPct;
    }
    if (rules.tens === 'blocked') {
      if (tensAllowed) {
        adjustments.push(`TENS turned off: it is not used on the ${region.label.toLowerCase()}.`);
      }
      tensAllowed = false;
      tensNote = rules.tensNote;
    } else if (rules.tens === 'caution' && rules.tensNote) {
      notes.push(rules.tensNote);
      if (!tensNote) tensNote = rules.tensNote;
    }
    if (rules.heatNote) notes.push(rules.heatNote);
  }

  const motors = motorSet.size > 0 ? [...motorSet].sort((a, b) => a - b) : ALL_MOTORS;
  if (regions.length > 0 && motors.length < ALL_MOTORS.length) {
    adjustments.push(
      `Using ${motors.length} of 16 motors to match the size of the area.`,
    );
  }

  return {
    heat: { targetC, minutes: Number(model.Heat_Duration_Min) || 0 },
    vibration: {
      intensityPct,
      motors,
      pulsed: /puls|intermit|burst/i.test(String(model.Vibration_Pattern)),
      minutes: Math.max(1, Number(model.Vibration_Duration_Min) || 0),
    },
    tens: {
      allowed: tensAllowed,
      minutes: tensAllowed ? Number(model.TENS_Duration_Min) || 0 : 0,
      note: tensNote,
    },
    adjustments,
    // the same note can arrive from two chosen areas
    notes: [...new Set(notes)],
  };
}
