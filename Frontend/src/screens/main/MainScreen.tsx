/**
 * MainScreen - the app after login. Hosts the 5 dock tabs + hamburger menu.
 * Tabs are created the first time you open them and then kept alive,
 * so the AI form, Bluetooth scan results etc. survive switching tabs.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { useTheme } from '../../theme';
import Dock from '../../components/layout/Dock';
import SideMenu, { MenuAction } from '../../components/layout/SideMenu';
import { MainNavContext } from '../../components/layout/MainNavContext';
import AppTour, { TourRegistry, TourRegistryProvider, TourStep } from '../../components/layout/AppTour';
import { useAppModal } from '../../components/feedback/AppModalProvider';
import { useUser } from '../../context/UserContext';
import { useBleSnapshot } from '../../services/bleService';
import { ScreenProps, TabKey } from '../../navigation/types';

import DashboardScreen from './dashboard/DashboardScreen';
import AnalysisScreen from './analysis/AnalysisScreen';
import DeviceScreen from './device/DeviceScreen';
import StatsScreen from './stats/StatsScreen';
import AssistantScreen from './assistant/AssistantScreen';

const TAB_COMPONENTS: Record<TabKey, React.ComponentType<{ active: boolean }>> = {
  home: DashboardScreen,
  analysis: AnalysisScreen,
  device: DeviceScreen,
  stats: StatsScreen,
  assistant: AssistantScreen,
};

// first-visit tour of the Home screen and the dock (shown once per account, can be replayed from Settings)
const tourSteps = (firstName: string): TourStep[] => [
  { icon: 'hand-wave-outline', title: `Welcome to SmartHeal${firstName ? `, ${firstName}` : ''}!`, text: 'Here is a quick tour of the app. It takes less than a minute.' },
  { target: 'hero', icon: 'line-scan', title: 'Start an AI scan', text: 'Take a photo of the painful area and describe your pain. SmartHeal’s AI suggests a personal heat, vibration and TENS plan.' },
  { target: 'today', icon: 'chart-donut', title: 'Today’s therapy', text: 'Your minutes of heat, vibration and TENS today. Each ring fills up as you reach your daily goal.' },
  { target: 'device', icon: 'bluetooth-connect', title: 'Your device', text: 'Shows whether your SmartHeal device is connected, with live heart rate and battery. Tap it to connect.' },
  { target: 'tab-analysis', fixed: true, icon: 'line-scan', title: 'AI Scan', text: 'Run a new scan and find all your saved reports. You can export any report as a PDF for your doctor.' },
  { target: 'tab-device', fixed: true, icon: 'bluetooth', title: 'Device', text: 'Pair your SmartHeal device over Bluetooth and control your therapy sessions.' },
  { target: 'tab-stats', fixed: true, icon: 'chart-box-outline', title: 'Stats', text: 'Follow your therapy history and progress over the days and weeks.' },
  { target: 'tab-assistant', fixed: true, icon: 'message-processing-outline', title: 'Assistant', text: 'Ask questions about your recovery or therapy, by typing or by voice.' },
  { icon: 'check-circle-outline', title: 'You’re all set', text: 'Open the menu (top left) for your profile, settings and help. You can replay this tour any time from Settings.' },
];

function TabPane({ tabKey, active }: { tabKey: TabKey; active: boolean }) {
  const Comp = TAB_COMPONENTS[tabKey];
  return (
    <View style={[styles.pane, !active && styles.hidden]}>
      <Comp active={active} />
    </View>
  );
}

export default function MainScreen({ navigation, route }: ScreenProps<'Main'>) {
  const modal = useAppModal();
  const { c } = useTheme();
  const { logout, profile, firstName, updateProfile } = useUser();
  const focused = useIsFocused();
  const { connectedDevice } = useBleSnapshot();
  const [tab, setTabState] = useState<TabKey>(route.params?.tab ?? 'home');
  const [visited, setVisited] = useState<TabKey[]>([route.params?.tab ?? 'home']);
  const [menuOpen, setMenuOpen] = useState(false);

  // ───── first-visit tour ─────
  const tourRegistry = useRef<TourRegistry>({ targets: new Map() }).current;
  const [tourOpen, setTourOpen] = useState(false);
  const tourSeen = profile?.settings?.tourDone === true;
  useEffect(() => {
    if (!profile || tourSeen || tourOpen || tab !== 'home' || !focused || menuOpen) return;
    const t = setTimeout(() => setTourOpen(true), 700); // let Home lay out first
    return () => clearTimeout(t);
  }, [profile, tourSeen, tourOpen, tab, focused, menuOpen]);
  const steps = useMemo(() => tourSteps(firstName), [firstName]);
  const finishTour = useCallback(() => {
    tourRegistry.scrollBy?.(-100000); // back to the top of Home
    setTourOpen(false);
    updateProfile({ settings: { ...(profile?.settings ?? {}), tourDone: true } }).catch(() => {});
  }, [profile?.settings, updateProfile, tourRegistry]);

  const setTab = useCallback((t: TabKey) => {
    setTabState(t);
    setVisited(v => (v.includes(t) ? v : [...v, t]));
  }, []);

  useEffect(() => {
    if (route.params?.tab) setTab(route.params.tab);
  }, [route.params?.tab, setTab]);

  // Android back: close menu -> go to Home tab -> leave app.
  // Registered once (values read from refs) so the AI tab's own back handler keeps priority.
  const stateRef = useRef({ menuOpen, tab });
  stateRef.current = { menuOpen, tab };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigation.isFocused()) return false; // e.g. Profile is open on top -> let it go back
      if (stateRef.current.menuOpen) {
        setMenuOpen(false);
        return true;
      }
      if (stateRef.current.tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [setTab, navigation]);

  const handleLogout = async () => {
    const ok = await modal.confirm({
      title: 'Log out?',
      message: 'You’ll need to log in again to use SmartHeal.',
      confirmLabel: 'Log out',
      destructive: true,
      icon: 'logout',
    });
    if (!ok) return;
    try {
      await logout();
    } finally {
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      modal.toast({ type: 'info', title: 'Logged out', message: 'See you soon' });
    }
  };

  const onMenu = (a: MenuAction) => {
    setMenuOpen(false);
    if (typeof a === 'object') return setTab(a.tab);
    switch (a) {
      case 'profile':
        return navigation.navigate('Profile');
      case 'settings':
        return navigation.navigate('Settings');
      case 'about':
        return navigation.navigate('About');
      case 'help':
        return modal.alert({
          type: 'info',
          icon: 'lifebuoy',
          title: 'Help & Support',
          message:
            'Having trouble with your device or the app? Contact the SmartHeal team at Runverve with your registered email and a short description of the issue. For medical concerns, always speak to your doctor.',
        });
      case 'privacy':
        return modal.alert({
          type: 'info',
          icon: 'shield-lock-outline',
          title: 'Privacy & Terms',
          message:
            'Your profile is stored securely in Firebase and only used to personalise therapy. Photos sent for AI analysis are processed by the AI service; a small thumbnail is kept with each saved report so you can see it later. You can delete any report from My reports. SmartHeal guidance is informational and does not replace a doctor.',
        });
      case 'logout':
        return handleLogout();
    }
  };

  const nav = useMemo(
    () => ({ tab, setTab, openMenu: () => setMenuOpen(true), openProfile: () => navigation.navigate('Profile') }),
    [tab, setTab, navigation],
  );

  return (
    <MainNavContext.Provider value={nav}>
      <TourRegistryProvider value={tourRegistry}>
      <View style={[styles.root, { backgroundColor: c.background }]}>
        {visited.map(k => (
          <TabPane key={k} tabKey={k} active={k === tab} />
        ))}
        <Dock active={tab} onChange={setTab} deviceConnected={!!connectedDevice} />
        <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} onSelect={onMenu} activeTab={tab} />
        {tourOpen ? <AppTour steps={steps} registry={tourRegistry} onFinish={finishTour} /> : null}
      </View>
      </TourRegistryProvider>
    </MainNavContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pane: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  hidden: { display: 'none' },
});
