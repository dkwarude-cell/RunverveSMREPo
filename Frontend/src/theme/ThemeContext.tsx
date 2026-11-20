/**
 * ThemeContext - light / dark mode for the whole app.
 *
 *   const { c, dark, setDark } = useTheme();         // current palette
 *   const s = useStyles(makeStyles);                 // styles rebuilt only when the theme changes
 *   const makeStyles = (c: Palette) => StyleSheet.create({ ... });
 *
 * The choice is saved in the user's profile (settings.darkMode) so it follows them across devices.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'react-native';
import { Palette, darkPalette, lightPalette, aiColors, AiColors } from './palette';
import { useUser } from '../context/UserContext';

type ThemeCtx = { c: Palette; dark: boolean; setDark: (v: boolean) => void; ai: AiColors };

const Ctx = createContext<ThemeCtx>({ c: lightPalette, dark: false, setDark: () => {}, ai: aiColors(lightPalette) });

export const useTheme = () => useContext(Ctx);

export function useStyles<T>(factory: (c: Palette) => T): T {
  const { c } = useTheme();
  return useMemo(() => factory(c), [c, factory]);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile, user, updateProfile } = useUser();
  const saved = profile?.settings?.darkMode;
  const [dark, setDarkState] = useState(false);

  // apply the saved preference once the profile loads; go back to light after logout
  useEffect(() => {
    if (!user) setDarkState(false);
    else if (typeof saved === 'boolean') setDarkState(saved);
  }, [saved, user]);

  const setDark = useCallback(
    (v: boolean) => {
      setDarkState(v);
      if (user) updateProfile({ settings: { ...(profile?.settings ?? {}), darkMode: v } }).catch(() => {});
    },
    [user, profile?.settings, updateProfile],
  );

  const value = useMemo(() => {
    const c = dark ? darkPalette : lightPalette;
    return { c, dark, setDark, ai: aiColors(c) };
  }, [dark, setDark]);

  return (
    <Ctx.Provider value={value}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      {children}
    </Ctx.Provider>
  );
}
