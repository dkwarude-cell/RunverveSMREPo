import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../../models/User';

const settingsSlice = createSlice({
  name: 'settings',
  initialState: DEFAULT_USER_SETTINGS as UserSettings,
  reducers: {
    setAllSettings(_state, action: PayloadAction<UserSettings>) {
      return action.payload;
    },
    updateSetting(state, action: PayloadAction<Partial<UserSettings>>) {
      return { ...state, ...action.payload };
    },
    resetSettings() {
      return DEFAULT_USER_SETTINGS;
    },
  },
});

export const { setAllSettings, updateSetting, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
