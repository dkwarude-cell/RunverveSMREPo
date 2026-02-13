import { useState, useCallback } from 'react';
import * as tfLiteService from '../../services/ai/tfLiteService';
import { detectKeypoints } from '../../services/ai/bodyDetection';
import { calculatePlacementZone } from '../../services/ai/placementCalculator';
import { validatePlacement, PlacementAccuracy } from '../../services/ai/validationService';
import { Keypoint } from '../../models/AIModels';
import { BodyArea } from '../../models/Session';

export function useAI() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
  const [accuracy, setAccuracy] = useState<PlacementAccuracy>('incorrect');
  const [loading, setLoading] = useState(false);

  const loadModel = useCallback(async () => {
    setLoading(true);
    await tfLiteService.loadModel();
    setModelLoaded(true);
    setLoading(false);
  }, []);

  const processFrame = useCallback(
    async (imageData: any, bodyArea: BodyArea) => {
      const kps = await detectKeypoints(imageData);
      setKeypoints(kps);

      const zone = calculatePlacementZone(kps, bodyArea);
      if (zone) {
        const result = validatePlacement(
          { x: 0, y: 0, width: 50, height: 50 }, // placeholder for hand position
          zone,
        );
        setAccuracy(result.accuracy);
      }
    },
    [],
  );

  const cleanup = useCallback(() => {
    tfLiteService.dispose();
    setModelLoaded(false);
    setKeypoints([]);
  }, []);

  return { modelLoaded, keypoints, accuracy, loading, loadModel, processFrame, cleanup };
}
