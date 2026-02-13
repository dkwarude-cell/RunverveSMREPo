/** App-wide constants */

export const MAX_INTENSITY_LEVEL = 10;
export const MIN_INTENSITY_LEVEL = 1;
export const MIN_SESSION_DURATION = 10; // minutes
export const MAX_SESSION_DURATION = 60; // minutes
export const BLE_SCAN_DURATION = 30; // seconds
export const BLE_RSSI_THRESHOLD = -90; // dBm
export const AI_HOLD_DURATION = 2; // seconds
export const AI_CONFIDENCE_THRESHOLD = 0.3;
export const BATTERY_WARNING_THRESHOLD = 20; // percent
export const SESSION_STATUS_POLL_INTERVAL = 5000; // ms
export const TIMER_INTERVAL = 1000; // ms

export const BODY_AREAS = [
  'lower_back',
  'upper_back',
  'neck',
  'shoulder_left',
  'shoulder_right',
  'elbow_left',
  'elbow_right',
  'knee_left',
  'knee_right',
  'ankle_left',
  'ankle_right',
  'hip_left',
  'hip_right',
] as const;

export const PROFILE_TYPES = ['runner', 'coach', 'wellness'] as const;

export const RUNNER_INTERESTS = [
  'Marathon training',
  'Sprinting',
  'Trail running',
  'Recovery',
  'Injury prevention',
];

export const COACH_INTERESTS = [
  'Sports performance',
  'Client management',
  'Rehabilitation',
  'Strength training',
];

export const WELLNESS_INTERESTS = [
  'Pain management',
  'Stress relief',
  'Flexibility',
  'Holistic health',
];

export const QUICK_ACTIONS = {
  runner: [
    { id: 'recovery', title: 'Start Recovery Session', icon: '🔄' },
    { id: 'pre_workout', title: 'Pre-Workout Protocol', icon: '🏃' },
    { id: 'training_plan', title: 'View Training Plan', icon: '📋' },
  ],
  coach: [
    { id: 'client_session', title: 'Create Client Session', icon: '👥' },
    { id: 'protocols', title: 'View Protocols', icon: '📝' },
    { id: 'client_progress', title: 'Track Client Progress', icon: '📊' },
  ],
  wellness: [
    { id: 'pain_relief', title: 'Pain Relief Session', icon: '💆' },
    { id: 'relaxation', title: 'Relaxation Protocol', icon: '🧘' },
    { id: 'wellness_check', title: 'Daily Wellness Check', icon: '✅' },
  ],
} as const;
