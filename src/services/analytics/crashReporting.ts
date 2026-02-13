/**
 * Crash / error reporting service.
 * In production, use Firebase Crashlytics or Sentry.
 */

export function logError(error: Error, context?: string): void {
  console.error(`[CrashReporting]${context ? ` ${context}:` : ''}`, error);
  // crashlytics().recordError(error);
}

export function log(message: string): void {
  console.log('[CrashReporting]', message);
  // crashlytics().log(message);
}
