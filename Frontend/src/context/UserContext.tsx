/**
 * UserContext - who is logged in (Firebase) + their saved profile (SmartHeal backend).
 *
 *   const { user, profile, displayName, refreshProfile, updateProfile, logout } = useUser();
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FirebaseAuthTypes, getAuth, onAuthStateChanged, signOut } from '@react-native-firebase/auth';
import { AuthService, UserProfileData } from '../services/authService';
import { GoogleAuthService } from '../services/googleAuthService';
import { disconnectBleDevice } from '../services/bleService';

type UserCtx = {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
  profile: UserProfileData | null;
  displayName: string;
  firstName: string;
  refreshProfile: () => Promise<UserProfileData | null>;
  updateProfile: (data: UserProfileData) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<UserCtx | null>(null);

export function useUser(): UserCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(getAuth().currentUser);
  const [initializing, setInitializing] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  // Firebase keeps the session on the phone, so a returning user stays logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), u => {
      setUser(u);
      if (!u) setProfile(null);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = useCallback(async () => {
    const current = getAuth().currentUser;
    if (!current) return null;
    try {
      const token = await current.getIdToken();
      const data = await AuthService.getProfile(token);
      setProfile(data);
      return data;
    } catch (e) {
      console.warn('Could not load profile', e);
      return null;
    }
  }, []);

  // load the profile whenever a user logs in
  useEffect(() => {
    if (user) refreshProfile();
  }, [user, refreshProfile]);

  const updateProfile = useCallback(
    async (data: UserProfileData) => {
      const current = getAuth().currentUser;
      if (!current) throw new Error('You are not logged in.');
      const token = await current.getIdToken();
      await AuthService.saveProfile(token, data);
      setProfile(p => ({ ...(p ?? {}), ...data }));
      refreshProfile();
    },
    [refreshProfile],
  );

  const logout = useCallback(async () => {
    try {
      await disconnectBleDevice();
    } catch {
      // no device connected
    }
    await GoogleAuthService.signOut();
    await signOut(getAuth());
    setProfile(null);
  }, []);

  const displayName = useMemo(() => {
    const name = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || 'there';
    return name;
  }, [profile?.fullName, user?.displayName, user?.email]);

  const firstName = displayName.split(' ')[0];

  const value = useMemo(
    () => ({ user, initializing, profile, displayName, firstName, refreshProfile, updateProfile, logout }),
    [user, initializing, profile, displayName, firstName, refreshProfile, updateProfile, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
