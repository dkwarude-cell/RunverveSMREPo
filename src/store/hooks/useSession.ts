import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '..';
import {
  startSession as startAction,
  pauseSession,
  resumeSession,
  stopSession,
  updateIntensity,
  tick,
  resetSession,
} from '../slices/sessionSlice';
import { SessionConfig, Session } from '../../models/Session';
import { createSession } from '../../services/session/sessionManager';

export function useSession() {
  const dispatch = useDispatch<AppDispatch>();
  const { activeSession, sessionState, timeRemaining, currentIntensity, config } = useSelector(
    (s: RootState) => s.session,
  );
  const userId = useSelector((s: RootState) => s.auth.user?.id ?? '');
  const deviceId = useSelector((s: RootState) => s.device.connectedDevice?.id);

  const start = useCallback(
    (cfg: SessionConfig) => {
      const session = createSession(cfg, userId, deviceId);
      dispatch(startAction({ session, config: cfg }));
    },
    [dispatch, userId, deviceId],
  );

  const pause = useCallback(() => dispatch(pauseSession()), [dispatch]);
  const resume = useCallback(() => dispatch(resumeSession()), [dispatch]);
  const stop = useCallback(() => dispatch(stopSession()), [dispatch]);
  const setIntensity = useCallback((level: number) => dispatch(updateIntensity(level)), [dispatch]);
  const timerTick = useCallback(() => dispatch(tick()), [dispatch]);
  const reset = useCallback(() => dispatch(resetSession()), [dispatch]);

  return {
    activeSession,
    sessionState,
    timeRemaining,
    currentIntensity,
    config,
    start,
    pause,
    resume,
    stop,
    setIntensity,
    timerTick,
    reset,
  };
}
