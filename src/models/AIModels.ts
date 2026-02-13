export interface Keypoint {
  x: number;
  y: number;
  confidence: number;
  name: string;
}

export const KEYPOINT_NAMES = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const;

export interface PlacementZone {
  bodyArea: string;
  keypoints: number[]; // indices into KEYPOINT_NAMES
  offset: { x: number; y: number };
  size: { width: number; height: number };
}

export const PLACEMENT_ZONES: Record<string, PlacementZone> = {
  lower_back: {
    bodyArea: 'lower_back',
    keypoints: [11, 12],
    offset: { x: 0, y: -50 },
    size: { width: 100, height: 80 },
  },
  upper_back: {
    bodyArea: 'upper_back',
    keypoints: [5, 6],
    offset: { x: 0, y: 30 },
    size: { width: 120, height: 100 },
  },
  neck: {
    bodyArea: 'neck',
    keypoints: [5, 6],
    offset: { x: 0, y: -40 },
    size: { width: 60, height: 40 },
  },
  shoulder_left: {
    bodyArea: 'shoulder_left',
    keypoints: [5],
    offset: { x: -20, y: 0 },
    size: { width: 60, height: 60 },
  },
  shoulder_right: {
    bodyArea: 'shoulder_right',
    keypoints: [6],
    offset: { x: 20, y: 0 },
    size: { width: 60, height: 60 },
  },
  knee_left: {
    bodyArea: 'knee_left',
    keypoints: [13],
    offset: { x: 0, y: 0 },
    size: { width: 60, height: 60 },
  },
  knee_right: {
    bodyArea: 'knee_right',
    keypoints: [14],
    offset: { x: 0, y: 0 },
    size: { width: 60, height: 60 },
  },
  ankle_left: {
    bodyArea: 'ankle_left',
    keypoints: [15],
    offset: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  },
  ankle_right: {
    bodyArea: 'ankle_right',
    keypoints: [16],
    offset: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  },
  hip_left: {
    bodyArea: 'hip_left',
    keypoints: [11],
    offset: { x: -20, y: 0 },
    size: { width: 60, height: 60 },
  },
  hip_right: {
    bodyArea: 'hip_right',
    keypoints: [12],
    offset: { x: 20, y: 0 },
    size: { width: 60, height: 60 },
  },
  elbow_left: {
    bodyArea: 'elbow_left',
    keypoints: [7],
    offset: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  },
  elbow_right: {
    bodyArea: 'elbow_right',
    keypoints: [8],
    offset: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
  },
};
