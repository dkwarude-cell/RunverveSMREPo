import { Keypoint } from '../../models/AIModels';
import { runInference } from './tfLiteService';

/**
 * Detect body keypoints from a camera frame.
 */
export async function detectKeypoints(imageData: any): Promise<Keypoint[]> {
  return runInference(imageData);
}

/**
 * Filter keypoints by confidence threshold.
 */
export function filterByConfidence(keypoints: Keypoint[], threshold: number): Keypoint[] {
  return keypoints.filter((kp) => kp.confidence >= threshold);
}
