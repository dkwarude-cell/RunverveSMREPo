import { SessionConfig, Session } from '../../models/Session';
import { generateId } from '../../utils/helpers';

/**
 * Create a new session object from configuration.
 */
export function createSession(config: SessionConfig, userId: string, deviceId?: string): Session {
  const now = Date.now();
  return {
    id: generateId(),
    userId,
    bodyArea: config.bodyArea,
    duration: 0,
    plannedDuration: config.duration * 60,
    intensity: config.intensity,
    mode: config.mode,
    startTime: now,
    endTime: 0,
    completed: false,
    deviceId,
  };
}

/**
 * Finalize session data when the session ends.
 */
export function finalizeSession(
  session: Session,
  rating?: number,
  notes?: string,
): Session {
  return {
    ...session,
    endTime: Date.now(),
    duration: Math.round((Date.now() - session.startTime) / 1000),
    completed: true,
    rating,
    notes,
  };
}
