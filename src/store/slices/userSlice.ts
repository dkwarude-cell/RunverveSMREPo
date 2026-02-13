import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserSettings, DEFAULT_USER_SETTINGS } from '../../models/User';

interface UserState {
  profile: User | null;
  settings: UserSettings;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  settings: DEFAULT_USER_SETTINGS,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<User>) {
      state.profile = action.payload;
    },
    updateProfile(state, action: PayloadAction<Partial<User>>) {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload, updatedAt: Date.now() };
      }
    },
    setSettings(state, action: PayloadAction<UserSettings>) {
      state.settings = action.payload;
    },
    updateSettings(state, action: PayloadAction<Partial<UserSettings>>) {
      state.settings = { ...state.settings, ...action.payload };
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearUserState(state) {
      state.profile = null;
      state.settings = DEFAULT_USER_SETTINGS;
    },
  },
});

export const { setProfile, updateProfile, setSettings, updateSettings, setLoading, setError, clearUserState } =
  userSlice.actions;
export default userSlice.reducer;
