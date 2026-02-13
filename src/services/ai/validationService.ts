/**
 * Validate whether the user's hand/device position overlaps the target placement zone.
 */

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PlacementAccuracy = 'correct' | 'close' | 'incorrect';

export function validatePlacement(
  currentPosition: Rect,
  targetZone: Rect,
): { accuracy: PlacementAccuracy; overlapPercent: number } {
  const overlapX = Math.max(
    0,
    Math.min(currentPosition.x + currentPosition.width, targetZone.x + targetZone.width) -
      Math.max(currentPosition.x, targetZone.x),
  );
  const overlapY = Math.max(
    0,
    Math.min(currentPosition.y + currentPosition.height, targetZone.y + targetZone.height) -
      Math.max(currentPosition.y, targetZone.y),
  );

  const overlapArea = overlapX * overlapY;
  const targetArea = targetZone.width * targetZone.height;
  const overlapPercent = targetArea > 0 ? (overlapArea / targetArea) * 100 : 0;

  let accuracy: PlacementAccuracy;
  if (overlapPercent >= 70) accuracy = 'correct';
  else if (overlapPercent >= 30) accuracy = 'close';
  else accuracy = 'incorrect';

  return { accuracy, overlapPercent };
}
