import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session, SessionConfig, SessionState as SState } from '../../models/Session';

interface SessionSliceState {
  activeSession: Session | null;
  sessionState: SState;
  timeRemaining: number; // seconds
  currentIntensity: number;
  config: SessionConfig | null;
}

const initialState: SessionSliceState = {
  activeSession: null,
  sessionState: 'idle',
  timeRemaining: 0,
  currentIntensity: 5,
  config: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    startSession(state, action: PayloadAction<{ session: Session; config: SessionConfig }>) {
      state.activeSession = action.payload.session;
      state.config = action.payload.config;
      state.sessionState = 'active';
      state.timeRemaining = action.payload.config.duration * 60;
      state.currentIntensity = action.payload.config.intensity;
    },
    pauseSession(state) {
      state.sessionState = 'paused';
    },
    resumeSession(state) {
      state.sessionState = 'active';
    },
    stopSession(state) {
      state.sessionState = 'stopped';
    },
    updateIntensity(state, action: PayloadAction<number>) {
      state.currentIntensity = action.payload;
    },
    tick(state) {
      if (state.sessionState === 'active' && state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
      if (state.timeRemaining <= 0 && state.sessionState === 'active') {
        state.sessionState = 'stopped';
      }
    },
    resetSession(state) {
      state.activeSession = null;
      state.sessionState = 'idle';
      state.timeRemaining = 0;
      state.currentIntensity = 5;
      state.config = null;
    },
  },
});

export const { startSession, pauseSession, resumeSession, stopSession, updateIntensity, tick, resetSession } =
  sessionSlice.actions;
export default sessionSlice.reducer;
