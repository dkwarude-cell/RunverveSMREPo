/**
 * bodyMap.ts - the regions of the interactive body map and the conditions each can carry.
 *
 * The wording is deliberately plain: these are "what this might be" prompts to help someone
 * describe their pain, not diagnoses. The AI scan and a clinician do the diagnosing.
 *
 * `therapy` carries the constraints the SmartHeal device must respect for each area. They
 * are applied in services/therapyPlan.ts before any output is driven, because a plan that
 * is safe on a calf is not necessarily safe on a throat or a chest.
 */

export type BodyView = 'front' | 'back';
export type BodySide = 'left' | 'right' | 'center';

export type Injury = {
  id: string;
  label: string;
  /** How it usually presents, in the words someone would use themselves. */
  description: string;
};

export type TensRule = 'ok' | 'caution' | 'blocked';

export type RegionTherapy = {
  /** Whether TENS pads may be placed here at all. */
  tens: TensRule;
  /** Shown to the user whenever tens is 'caution' or 'blocked'. */
  tensNote?: string;
  /** Upper limit for the heating patch, °C. The device's own ceiling still applies. */
  maxHeatC?: number;
  heatNote?: string;
  /** Vibration is gentle, but a few areas should still not be driven hard. */
  maxVibrationPct?: number;
};

export type BodyRegion = {
  id: string;
  /** Full name, e.g. "Right knee". */
  label: string;
  /** Name without the side, for the detail sheet heading. */
  shortLabel: string;
  view: BodyView;
  side: BodySide;
  /** The vocabulary the image model tends to use, for matching its prediction to this region. */
  aiLabels: string[];
  injuries: Injury[];
  therapy: RegionTherapy;
};

/** Safe default for the large, fleshy areas the device is designed for. */
const STANDARD: RegionTherapy = { tens: 'ok', maxHeatC: 42 };

/** Mirrors one side's injuries onto the other so left and right stay in step. */
const sided = (
  base: Omit<BodyRegion, 'id' | 'label' | 'side'>,
  idBase: string,
  labelBase: string,
): BodyRegion[] =>
  (['left', 'right'] as const).map(side => ({
    ...base,
    id: `${idBase}_${side[0]}`,
    label: `${side === 'left' ? 'Left' : 'Right'} ${labelBase}`,
    side,
  }));

// ── front ────────────────────────────────────────────────────────────────────

const HEAD: BodyRegion = {
  id: 'head',
  label: 'Head and face',
  shortLabel: 'Head and face',
  view: 'front',
  side: 'center',
  aiLabels: ['head', 'face', 'forehead', 'scalp'],
  injuries: [
    {
      id: 'tension_headache',
      label: 'Tension headache',
      description: 'A band of tightness around the head, often with a stiff neck.',
    },
    {
      id: 'migraine',
      label: 'Migraine',
      description: 'Throbbing pain, usually one-sided, often with light or sound sensitivity.',
    },
    {
      id: 'tmj',
      label: 'Jaw joint pain',
      description: 'Pain at the jaw hinge when chewing or yawning, sometimes with clicking.',
    },
    {
      id: 'sinus',
      label: 'Sinus pressure',
      description: 'Pressure across the cheeks and forehead, worse when you bend forward.',
    },
  ],
  therapy: {
    tens: 'blocked',
    tensNote: 'TENS pads are not used on the head or face.',
    maxHeatC: 38,
    heatNote: 'Keep heat low and never over the eyes.',
    maxVibrationPct: 40,
  },
};

const NECK_FRONT: BodyRegion = {
  id: 'neck_front',
  label: 'Front of neck and throat',
  shortLabel: 'Front of neck',
  view: 'front',
  side: 'center',
  aiLabels: ['neck', 'throat'],
  injuries: [
    {
      id: 'neck_strain_front',
      label: 'Muscle strain',
      description: 'Soreness along the front or side of the neck after a sudden movement.',
    },
    {
      id: 'whiplash',
      label: 'Whiplash',
      description: 'Neck pain and stiffness that came on after a jolt or an accident.',
    },
  ],
  therapy: {
    tens: 'blocked',
    tensNote:
      'TENS is never placed on the front of the neck: the pulse can affect the nerves that control blood pressure and the airway.',
    maxHeatC: 39,
    maxVibrationPct: 40,
  },
};

const SHOULDERS = sided(
  {
    shortLabel: 'Shoulder',
    view: 'front',
    aiLabels: ['shoulder', 'deltoid', 'clavicle'],
    injuries: [
      {
        id: 'rotator_cuff',
        label: 'Rotator cuff strain',
        description: 'Pain lifting the arm overhead or reaching behind you.',
      },
      {
        id: 'impingement',
        label: 'Shoulder impingement',
        description: 'A pinching pain in a specific arc as you raise the arm to the side.',
      },
      {
        id: 'frozen_shoulder',
        label: 'Frozen shoulder',
        description: 'The shoulder has gradually become stiff and hard to move in every direction.',
      },
      {
        id: 'ac_joint',
        label: 'Joint pain on top',
        description: 'Tenderness right on top of the shoulder, worse carrying or lying on it.',
      },
      {
        id: 'bursitis_shoulder',
        label: 'Bursitis',
        description: 'A deep ache on the outer shoulder, often worse at night.',
      },
    ],
    therapy: STANDARD,
  },
  'shoulder',
  'shoulder',
);

const CHEST: BodyRegion = {
  id: 'chest',
  label: 'Chest',
  shortLabel: 'Chest',
  view: 'front',
  side: 'center',
  aiLabels: ['chest', 'pectoral', 'sternum', 'rib'],
  injuries: [
    {
      id: 'chest_strain',
      label: 'Chest muscle strain',
      description: 'Soreness across the chest after pushing, lifting or a hard session.',
    },
    {
      id: 'costochondritis',
      label: 'Rib joint inflammation',
      description: 'Sharp, tender pain near the breastbone, worse on a deep breath.',
    },
    {
      id: 'rib_bruise',
      label: 'Bruised ribs',
      description: 'Pain over the ribs after a knock, worse when coughing or twisting.',
    },
  ],
  therapy: {
    tens: 'caution',
    tensNote:
      'Do not use TENS across the chest if you have a pacemaker or any implanted heart device. Chest pain with breathlessness needs a doctor, not a therapy session.',
    maxHeatC: 41,
    maxVibrationPct: 70,
  },
};

const UPPER_ARMS = sided(
  {
    shortLabel: 'Upper arm',
    view: 'front',
    aiLabels: ['arm', 'upper arm', 'bicep', 'tricep'],
    injuries: [
      {
        id: 'bicep_strain',
        label: 'Biceps strain',
        description: 'Pain at the front of the upper arm when bending the elbow or lifting.',
      },
      {
        id: 'tricep_strain',
        label: 'Triceps strain',
        description: 'Pain at the back of the upper arm when straightening or pushing.',
      },
      {
        id: 'arm_doms',
        label: 'Muscle soreness',
        description: 'Widespread aching a day or two after unusual or heavy use.',
      },
    ],
    therapy: STANDARD,
  },
  'upper_arm',
  'upper arm',
);

const ELBOWS = sided(
  {
    shortLabel: 'Elbow',
    view: 'front',
    aiLabels: ['elbow'],
    injuries: [
      {
        id: 'tennis_elbow',
        label: 'Tennis elbow',
        description: 'Pain on the outer elbow when gripping, lifting or turning a handle.',
      },
      {
        id: 'golfers_elbow',
        label: "Golfer's elbow",
        description: 'Pain on the inner elbow when gripping or flexing the wrist.',
      },
      {
        id: 'elbow_bursitis',
        label: 'Bursitis',
        description: 'A swollen, tender lump over the point of the elbow.',
      },
      {
        id: 'ulnar_nerve',
        label: 'Nerve irritation',
        description: 'Tingling from the inner elbow into the ring and little fingers.',
      },
    ],
    therapy: STANDARD,
  },
  'elbow',
  'elbow',
);

const FOREARMS = sided(
  {
    shortLabel: 'Forearm, wrist and hand',
    view: 'front',
    aiLabels: ['forearm', 'wrist', 'hand', 'finger', 'thumb', 'palm'],
    injuries: [
      {
        id: 'forearm_strain',
        label: 'Forearm strain',
        description: 'Aching forearm muscles from repeated gripping, lifting or typing.',
      },
      {
        id: 'wrist_sprain',
        label: 'Wrist sprain',
        description: 'Pain after a fall onto the hand or a sudden twist of the wrist.',
      },
      {
        id: 'de_quervain',
        label: 'Thumb-side tendon pain',
        description: 'Pain at the base of the thumb when gripping or lifting.',
      },
      {
        id: 'carpal_tunnel',
        label: 'Tingling in the fingers',
        description: 'Numbness or tingling in the thumb and fingers, often worst at night.',
      },
      {
        id: 'hand_arthritis',
        label: 'Joint stiffness',
        description: 'Stiff, achy finger joints, usually worse in the morning.',
      },
    ],
    therapy: { tens: 'ok', maxHeatC: 41, maxVibrationPct: 80 },
  },
  'forearm',
  'forearm, wrist and hand',
);

const ABDOMEN: BodyRegion = {
  id: 'abdomen',
  label: 'Abdomen',
  shortLabel: 'Abdomen',
  view: 'front',
  side: 'center',
  aiLabels: ['abdomen', 'stomach', 'belly', 'core'],
  injuries: [
    {
      id: 'ab_strain',
      label: 'Abdominal strain',
      description: 'Pain across the stomach muscles after twisting, lifting or hard training.',
    },
    {
      id: 'oblique_strain',
      label: 'Side strain',
      description: 'Pain along the side of the trunk when twisting or reaching.',
    },
    {
      id: 'period_cramps',
      label: 'Period cramps',
      description: 'Cramping low in the abdomen around your period.',
    },
  ],
  therapy: {
    tens: 'caution',
    tensNote: 'Do not use TENS or the heating patch on the abdomen if you are, or might be, pregnant.',
    maxHeatC: 40,
    heatNote: 'Stomach pain that is severe, new or comes with fever needs a doctor first.',
    maxVibrationPct: 60,
  },
};

const HIPS = sided(
  {
    shortLabel: 'Hip and groin',
    view: 'front',
    aiLabels: ['hip', 'groin', 'pelvis'],
    injuries: [
      {
        id: 'hip_flexor',
        label: 'Hip flexor strain',
        description: 'Pain at the front of the hip when lifting the knee or sprinting.',
      },
      {
        id: 'groin_strain',
        label: 'Groin strain',
        description: 'Pain on the inner thigh when bringing the legs together or changing direction.',
      },
      {
        id: 'hip_bursitis',
        label: 'Bursitis',
        description: 'Tenderness on the bony point of the hip, worse lying on that side.',
      },
      {
        id: 'hip_oa',
        label: 'Hip joint stiffness',
        description: 'Deep groin pain and stiffness, worse after sitting or on first standing.',
      },
    ],
    therapy: STANDARD,
  },
  'hip',
  'hip and groin',
);

const THIGHS_FRONT = sided(
  {
    shortLabel: 'Thigh',
    view: 'front',
    aiLabels: ['thigh', 'quadriceps', 'quad', 'leg'],
    injuries: [
      {
        id: 'quad_strain',
        label: 'Quadriceps strain',
        description: 'Pain at the front of the thigh when kicking, sprinting or climbing stairs.',
      },
      {
        id: 'thigh_contusion',
        label: 'Dead leg',
        description: 'A deep bruise after a direct knock to the thigh.',
      },
      {
        id: 'it_band',
        label: 'Outer thigh tightness',
        description: 'Tightness down the outside of the thigh, often with knee pain when running.',
      },
      {
        id: 'thigh_cramp',
        label: 'Cramp or spasm',
        description: 'Sudden, gripping tightening of the thigh muscle.',
      },
    ],
    therapy: STANDARD,
  },
  'thigh',
  'thigh',
);

const KNEES = sided(
  {
    shortLabel: 'Knee',
    view: 'front',
    aiLabels: ['knee', 'patella', 'kneecap'],
    injuries: [
      {
        id: 'patellofemoral',
        label: 'Kneecap pain',
        description: 'Aching around the kneecap on stairs, squatting or after long sitting.',
      },
      {
        id: 'meniscus',
        label: 'Cartilage injury',
        description: 'Pain on the joint line with twisting, sometimes catching or locking.',
      },
      {
        id: 'ligament_knee',
        label: 'Ligament sprain',
        description: 'Pain and a feeling of give-way after a twist or an awkward landing.',
      },
      {
        id: 'patellar_tendon',
        label: 'Tendon pain below the kneecap',
        description: 'Pain just under the kneecap when jumping or landing.',
      },
      {
        id: 'knee_oa',
        label: 'Knee joint stiffness',
        description: 'Stiff, achy knee that is worse in the morning or after rest.',
      },
      {
        id: 'knee_swelling',
        label: 'Swelling',
        description: 'The knee feels puffy, tight and harder to bend fully.',
      },
    ],
    therapy: STANDARD,
  },
  'knee',
  'knee',
);

const SHINS = sided(
  {
    shortLabel: 'Shin',
    view: 'front',
    aiLabels: ['shin', 'tibia', 'lower leg'],
    injuries: [
      {
        id: 'shin_splints',
        label: 'Shin splints',
        description: 'Aching along the inner shin bone during or after running.',
      },
      {
        id: 'tibialis_strain',
        label: 'Front shin muscle strain',
        description: 'Pain at the front of the shin when lifting the foot.',
      },
      {
        id: 'shin_bruise',
        label: 'Bruise or knock',
        description: 'Tenderness and swelling after a direct hit to the shin.',
      },
    ],
    therapy: STANDARD,
  },
  'shin',
  'shin',
);

const FEET = sided(
  {
    shortLabel: 'Ankle and foot',
    view: 'front',
    aiLabels: ['ankle', 'foot', 'toe', 'heel', 'sole'],
    injuries: [
      {
        id: 'ankle_sprain',
        label: 'Ankle sprain',
        description: 'Pain and swelling on the outside of the ankle after rolling it.',
      },
      {
        id: 'plantar_fasciitis',
        label: 'Arch and heel pain',
        description: 'Sharp heel pain on your first steps in the morning.',
      },
      {
        id: 'metatarsalgia',
        label: 'Pain in the ball of the foot',
        description: 'Burning or aching under the ball of the foot when walking.',
      },
      {
        id: 'foot_arthritis',
        label: 'Joint stiffness',
        description: 'Stiff, sore toe or midfoot joints, worse after rest.',
      },
      {
        id: 'diabetic_foot',
        label: 'Numbness or burning',
        description: 'Loss of feeling, tingling or burning in the feet.',
      },
    ],
    therapy: {
      tens: 'ok',
      maxHeatC: 40,
      heatNote:
        'If you have diabetes or reduced feeling in your feet, keep heat low: skin can burn before you feel it.',
    },
  },
  'foot',
  'ankle and foot',
);

// ── back ─────────────────────────────────────────────────────────────────────

const NECK_BACK: BodyRegion = {
  id: 'neck_back',
  label: 'Back of neck',
  shortLabel: 'Back of neck',
  view: 'back',
  side: 'center',
  aiLabels: ['neck', 'cervical', 'nape'],
  injuries: [
    {
      id: 'neck_strain',
      label: 'Neck strain',
      description: 'Stiff, sore neck after sleeping awkwardly or long hours at a screen.',
    },
    {
      id: 'tech_neck',
      label: 'Postural neck pain',
      description: 'A dull ache at the base of the neck that builds through the day.',
    },
    {
      id: 'cervical_radiculopathy',
      label: 'Nerve pain into the arm',
      description: 'Neck pain with tingling, numbness or weakness running down one arm.',
    },
    {
      id: 'neck_spasm',
      label: 'Muscle spasm',
      description: 'The neck has locked up and turning your head is painful.',
    },
  ],
  therapy: {
    tens: 'caution',
    tensNote: 'Keep pads on the back of the neck only, never around the front or throat.',
    maxHeatC: 41,
    maxVibrationPct: 60,
  },
};

const UPPER_BACK: BodyRegion = {
  id: 'upper_back',
  label: 'Upper back',
  shortLabel: 'Upper back',
  view: 'back',
  side: 'center',
  aiLabels: ['upper back', 'thoracic', 'trapezius', 'back'],
  injuries: [
    {
      id: 'trap_tension',
      label: 'Muscle tension',
      description: 'Tight, ropey muscles between the neck and shoulders.',
    },
    {
      id: 'thoracic_stiffness',
      label: 'Upper back stiffness',
      description: 'Stiffness between the shoulder blades, worse after sitting.',
    },
    {
      id: 'postural_strain',
      label: 'Postural strain',
      description: 'An ache that builds through a day at a desk and eases when you move.',
    },
    {
      id: 'rib_joint',
      label: 'Rib joint pain',
      description: 'A sharp, localised catch beside the spine on a deep breath.',
    },
  ],
  therapy: STANDARD,
};

const SHOULDER_BLADES = sided(
  {
    shortLabel: 'Shoulder blade',
    view: 'back',
    aiLabels: ['shoulder blade', 'scapula', 'upper back'],
    injuries: [
      {
        id: 'scapular_pain',
        label: 'Pain around the shoulder blade',
        description: 'A deep ache under or beside the shoulder blade.',
      },
      {
        id: 'rhomboid_strain',
        label: 'Muscle strain',
        description: 'Soreness between the spine and the shoulder blade after pulling or lifting.',
      },
      {
        id: 'trigger_point',
        label: 'Knot or trigger point',
        description: 'A tender spot that refers pain elsewhere when pressed.',
      },
    ],
    therapy: STANDARD,
  },
  'shoulder_blade',
  'shoulder blade',
);

const MID_BACK: BodyRegion = {
  id: 'mid_back',
  label: 'Mid back',
  shortLabel: 'Mid back',
  view: 'back',
  side: 'center',
  aiLabels: ['mid back', 'thoracic', 'back'],
  injuries: [
    {
      id: 'mid_back_strain',
      label: 'Muscle strain',
      description: 'Soreness across the middle of the back after lifting or twisting.',
    },
    {
      id: 'mid_back_stiffness',
      label: 'Stiffness',
      description: 'A tight, restricted feeling when you rotate or reach.',
    },
    {
      id: 'mid_back_spasm',
      label: 'Muscle spasm',
      description: 'A sudden gripping that makes it hard to straighten up.',
    },
  ],
  therapy: STANDARD,
};

const LOWER_BACK: BodyRegion = {
  id: 'lower_back',
  label: 'Lower back',
  shortLabel: 'Lower back',
  view: 'back',
  side: 'center',
  aiLabels: ['lower back', 'lumbar', 'back', 'spine'],
  injuries: [
    {
      id: 'lumbar_strain',
      label: 'Muscle strain',
      description: 'Pain after lifting, twisting or a sudden movement.',
    },
    {
      id: 'lumbar_stiffness',
      label: 'Stiffness',
      description: 'Stiff and achy, often worse in the morning or after sitting.',
    },
    {
      id: 'disc_pain',
      label: 'Disc-related pain',
      description: 'Deep pain in the low back, worse bending or sitting, sometimes with leg symptoms.',
    },
    {
      id: 'sciatica',
      label: 'Pain spreading down the leg',
      description: 'Pain, tingling or numbness travelling into the buttock or leg.',
    },
    {
      id: 'si_joint',
      label: 'Pain to one side of the base',
      description: 'A one-sided ache low down near the dimple of the back.',
    },
    {
      id: 'lumbar_spasm',
      label: 'Muscle spasm',
      description: 'The back has locked and movement sets off a strong grip.',
    },
  ],
  therapy: STANDARD,
};

const GLUTES = sided(
  {
    shortLabel: 'Buttock',
    view: 'back',
    aiLabels: ['buttock', 'glute', 'hip', 'gluteal'],
    injuries: [
      {
        id: 'glute_strain',
        label: 'Muscle strain',
        description: 'Deep soreness in the buttock after running, lifting or a hard session.',
      },
      {
        id: 'piriformis',
        label: 'Deep buttock pain',
        description: 'A deep ache in the buttock, sometimes with tingling down the leg.',
      },
      {
        id: 'glute_tendon',
        label: 'Tendon pain at the hip',
        description: 'Tenderness on the side of the hip, worse lying on it or climbing stairs.',
      },
    ],
    therapy: STANDARD,
  },
  'glute',
  'buttock',
);

const HAMSTRINGS = sided(
  {
    shortLabel: 'Hamstring',
    view: 'back',
    aiLabels: ['hamstring', 'thigh', 'back of thigh', 'leg'],
    injuries: [
      {
        id: 'hamstring_strain',
        label: 'Hamstring strain',
        description: 'Sharp pain at the back of the thigh during sprinting or stretching.',
      },
      {
        id: 'hamstring_tendon',
        label: 'Tendon pain at the sit bone',
        description: 'Pain high up where the hamstring attaches, worse sitting on hard chairs.',
      },
      {
        id: 'hamstring_tightness',
        label: 'Tightness',
        description: 'A persistent pulling feeling that limits bending forward.',
      },
      {
        id: 'hamstring_cramp',
        label: 'Cramp or spasm',
        description: 'Sudden, gripping tightening at the back of the thigh.',
      },
    ],
    therapy: STANDARD,
  },
  'hamstring',
  'hamstring',
);

const CALVES = sided(
  {
    shortLabel: 'Calf',
    view: 'back',
    aiLabels: ['calf', 'lower leg', 'gastrocnemius'],
    injuries: [
      {
        id: 'calf_strain',
        label: 'Calf strain',
        description: 'A sudden pull in the calf when pushing off or sprinting.',
      },
      {
        id: 'calf_cramp',
        label: 'Cramp',
        description: 'A hard, gripping cramp, often at night or after exercise.',
      },
      {
        id: 'calf_tightness',
        label: 'Tightness',
        description: 'Persistent tightness that limits how far the ankle bends.',
      },
    ],
    therapy: {
      tens: 'ok',
      maxHeatC: 42,
      heatNote:
        'A calf that is swollen, hot, red and painful at rest needs urgent medical advice before any therapy.',
    },
  },
  'calf',
  'calf',
);

const HEELS = sided(
  {
    shortLabel: 'Heel and Achilles',
    view: 'back',
    aiLabels: ['heel', 'achilles', 'ankle', 'foot'],
    injuries: [
      {
        id: 'achilles_tendon',
        label: 'Achilles tendon pain',
        description: 'Pain and stiffness in the cord above the heel, worst on first steps.',
      },
      {
        id: 'heel_pain',
        label: 'Heel pain',
        description: 'Tenderness under or behind the heel when standing or walking.',
      },
      {
        id: 'achilles_tightness',
        label: 'Tightness',
        description: 'The tendon feels short and stiff, especially in the morning.',
      },
    ],
    therapy: {
      tens: 'ok',
      maxHeatC: 40,
      heatNote:
        'If you have diabetes or reduced feeling in your feet, keep heat low: skin can burn before you feel it.',
    },
  },
  'heel',
  'heel and Achilles',
);

export const BODY_REGIONS: BodyRegion[] = [
  HEAD,
  NECK_FRONT,
  ...SHOULDERS,
  CHEST,
  ...UPPER_ARMS,
  ...ELBOWS,
  ...FOREARMS,
  ABDOMEN,
  ...HIPS,
  ...THIGHS_FRONT,
  ...KNEES,
  ...SHINS,
  ...FEET,
  NECK_BACK,
  UPPER_BACK,
  ...SHOULDER_BLADES,
  MID_BACK,
  LOWER_BACK,
  ...GLUTES,
  ...HAMSTRINGS,
  ...CALVES,
  ...HEELS,
];

export const regionsFor = (view: BodyView) => BODY_REGIONS.filter(r => r.view === view);

export const regionById = (id: string) => BODY_REGIONS.find(r => r.id === id);

export const injuryById = (regionId: string, injuryId: string) =>
  regionById(regionId)?.injuries.find(i => i.id === injuryId);

/**
 * Best region for a label the image model produced. Side is unknown from a photo, so a
 * two-sided match returns the left one only as a starting point for the user to correct.
 */
export function regionForAiLabel(aiLabel: string): BodyRegion | undefined {
  const needle = aiLabel.toLowerCase().replace(/_/g, ' ').trim();
  if (!needle) return undefined;

  const exact = BODY_REGIONS.find(region =>
    region.aiLabels.some(label => label === needle),
  );
  if (exact) return exact;

  return BODY_REGIONS.find(region =>
    region.aiLabels.some(label => needle.includes(label) || label.includes(needle)),
  );
}

/** What the user picked, as stored on a report and sent onward. */
export type BodySelection = {
  regionId: string;
  injuryIds: string[];
};

/** A short human sentence for a selection, e.g. "Right knee - cartilage injury, swelling". */
export function describeSelection(selection: BodySelection): string {
  const region = regionById(selection.regionId);
  if (!region) return selection.regionId;
  const injuries = selection.injuryIds
    .map(id => injuryById(selection.regionId, id)?.label.toLowerCase())
    .filter(Boolean);
  return injuries.length ? `${region.label} - ${injuries.join(', ')}` : region.label;
}
