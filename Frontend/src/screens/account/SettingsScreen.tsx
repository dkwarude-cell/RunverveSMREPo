/**
 * SettingsScreen - app preferences (saved to the user's profile), account actions, about.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import Screen from '../../components/layout/Screen';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import { ListRow, ScreenHeader, SectionHeader } from '../../components/ui/Bits';
import { useAppModal } from '../../components/feedback/AppModalProvider';
import { useUser } from '../../context/UserContext';
import type { UserSettings } from '../../services/authService';
import ForgotPasswordSheet from '../auth/ForgotPasswordSheet';
import { apiErrorMessage } from '../../services/apiClient';
import { ScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme';

export default function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  const modal = useAppModal();
  const { dark, setDark } = useTheme();
  const { user, profile, updateProfile, logout } = useUser();
  const [local, setLocal] = useState<UserSettings>({ aiWarmUp: true, ...(profile?.settings ?? {}) });
  const [resetOpen, setResetOpen] = useState(false);

  // keep in sync when the profile finishes loading
  useEffect(() => {
    setLocal({ aiWarmUp: true, ...(profile?.settings ?? {}) });
  }, [profile?.settings]);

  const toggle = async (key: keyof UserSettings, value: boolean) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    try {
      await updateProfile({ settings: next });
    } catch (e: any) {
      setLocal(local);
      modal.alert({ type: 'error', title: 'Could not save setting', message: apiErrorMessage(e, 'Please try again.') });
    }
  };

  // shows the first-visit tour again on the Home screen
  const replayTour = async () => {
    try {
      await updateProfile({ settings: { ...local, tourDone: false } });
      navigation.navigate('Main', { tab: 'home' });
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Could not start the tour', message: apiErrorMessage(e, 'Please try again.') });
    }
  };

  const doLogout = async () => {
    const ok = await modal.confirm({ title: 'Log out?', confirmLabel: 'Log out', destructive: true, icon: 'logout' });
    if (!ok) return;
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    modal.toast({ type: 'info', title: 'Logged out' });
  };

  return (
    <Screen header={<ScreenHeader title="Settings" onBack={() => navigation.goBack()} />}>
      <SectionHeader title="Appearance" style={styles.first} />
      <Card padding={8}>
        <ListRow icon="weather-night" label="Dark mode" toggle={dark} onToggle={setDark} last />
      </Card>
      <AppText variant="small" tone="muted" style={styles.note}>
        Pure black (AMOLED) theme with white and red accents.
      </AppText>

      <SectionHeader title="Preferences" />
      <Card padding={8}>
        <ListRow icon="lightning-bolt-outline" label="Pre-load AI server" toggle={local.aiWarmUp !== false} onToggle={v => toggle('aiWarmUp', v)} />
        <ListRow icon="ruler" label="Units" value="Metric (cm, kg, °C)" />
        <ListRow icon="map-marker-path" label="Replay app tour" onPress={replayTour} last />
      </Card>
      <AppText variant="small" tone="muted" style={styles.note}>
        <AppText variant="small" style={styles.bold}>Pre-load AI server</AppText> wakes the cloud AI when you open the AI Scan tab so the first scan is faster.
      </AppText>

      <SectionHeader title="Account" />
      <Card padding={8}>
        <ListRow icon="account-edit-outline" label="Edit profile" onPress={() => navigation.navigate('Profile')} />
        <ListRow icon="lock-reset" label="Change password" onPress={() => setResetOpen(true)} />
        <ListRow icon="logout" label="Log out" danger onPress={doLogout} last />
      </Card>

      <SectionHeader title="About" />
      <Card padding={8}>
        <ListRow icon="information-outline" label="About SmartHeal" onPress={() => navigation.navigate('About')} />
        <ListRow icon="tag-outline" label="Version" value="1.0.0" last />
      </Card>
      <ForgotPasswordSheet visible={resetOpen} onClose={() => setResetOpen(false)} initialEmail={user?.email ?? undefined} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  first: { marginTop: 8 },
  note: { marginTop: 10, marginHorizontal: 4, lineHeight: 18 },
  bold: { fontWeight: '700' },
});
