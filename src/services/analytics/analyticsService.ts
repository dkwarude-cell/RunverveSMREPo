/**
 * Analytics service – wraps Firebase Analytics.
 * In production, use @react-native-firebase/analytics.
 */

export function logEvent(name: string, params?: Record<string, any>): void {
  // analytics().logEvent(name, params);
  if (__DEV__) {
    console.log('[Analytics]', name, params);
  }
}

export function setUserId(userId: string): void {
  // analytics().setUserId(userId);
  if (__DEV__) {
    console.log('[Analytics] setUserId', userId);
  }
}

export function setUserProperty(name: string, value: string): void {
  // analytics().setUserProperty(name, value);
  if (__DEV__) {
    console.log('[Analytics] setUserProperty', name, value);
  }
}
