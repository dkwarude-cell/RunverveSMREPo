/**
 * TensorFlow Lite model loading service.
 * Wraps @tensorflow/tfjs-react-native for MoveNet Lightning inference.
 * Full implementation requires the tfjs-react-native native module;
 * this provides the typed interface for the rest of the app.
 */

import { Keypoint, KEYPOINT_NAMES } from '../../models/AIModels';

let modelLoaded = false;

export async function loadModel(_modelPath?: string): Promise<void> {
  // In production:
  // await tf.ready();
  // await tf.setBackend('rn-webgl');
  // model = await tflite.loadTFLiteModel(modelPath);
  modelLoaded = true;
  console.log('TFLite model loaded (stub)');
}

export async function runInference(_imageData: any): Promise<Keypoint[]> {
  if (!modelLoaded) throw new Error('Model not loaded. Call loadModel() first.');
  // Stub – return empty keypoints; replace with real inference
  return KEYPOINT_NAMES.map((name, i) => ({
    x: 0,
    y: 0,
    confidence: 0,
    name,
  }));
}

export function dispose(): void {
  modelLoaded = false;
}

export function isModelLoaded(): boolean {
  return modelLoaded;
}
