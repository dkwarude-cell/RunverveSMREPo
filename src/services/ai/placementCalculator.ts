import { Keypoint, PLACEMENT_ZONES, PlacementZone } from '../../models/AIModels';
import { BodyArea } from '../../models/Session';

interface CalculatedZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Given detected keypoints and target body area, calculate the electrode placement zone.
 */
export function calculatePlacementZone(
  keypoints: Keypoint[],
  bodyArea: BodyArea,
): CalculatedZone | null {
  const zone: PlacementZone | undefined = PLACEMENT_ZONES[bodyArea];
  if (!zone) return null;

  const relevantKps = zone.keypoints.map((idx) => keypoints[idx]).filter((kp) => kp && kp.confidence > 0.3);
  if (relevantKps.length === 0) return null;

  const avgX = relevantKps.reduce((s, kp) => s + kp.x, 0) / relevantKps.length;
  const avgY = relevantKps.reduce((s, kp) => s + kp.y, 0) / relevantKps.length;

  return {
    x: avgX + zone.offset.x - zone.size.width / 2,
    y: avgY + zone.offset.y - zone.size.height / 2,
    width: zone.size.width,
    height: zone.size.height,
  };
}
