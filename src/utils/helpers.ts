/** Generic helper functions */

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateChecksum(bytes: number[]): number {
  return bytes.reduce((sum, b) => sum ^ b, 0);
}

export function rssiToDistance(rssi: number): 'near' | 'medium' | 'far' {
  if (rssi > -60) return 'near';
  if (rssi > -80) return 'medium';
  return 'far';
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}
