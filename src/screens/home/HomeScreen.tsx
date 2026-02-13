import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { theme } from '../../styles/theme';
import SafeAreaView from '../../components/common/SafeAreaView';
import ModeSwitcher from '../../components/home/ModeSwitcher';
import QuickActionsPanel from '../../components/home/QuickActionsPanel';
import RecentSessionsWidget from '../../components/home/RecentSessionsWidget';
import DeviceStatusWidget from '../../components/home/DeviceStatusWidget';
import AchievementWidget from '../../components/home/AchievementWidget';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { QUICK_ACTIONS } from '../../utils/constants';
import { getRecentSessions } from '../../services/session/sessionHistory';
import { getAchievements } from '../../services/gamification/achievementService';
import { Session } from '../../models/Session';
import { Achievement } from '../../models/Achievement';

export default function HomeScreen({ navigation }: any) {
  const user = useSelector((s: RootState) => s.auth.user);
  const profileType = useSelector((s: RootState) => s.user.profile?.profileType ?? 'wellness');
  const deviceStatus = useSelector((s: RootState) => s.device.connectionStatus);
  const deviceName = useSelector((s: RootState) => s.device.connectedDevice?.deviceName);
  const battery = useSelector((s: RootState) => s.device.batteryLevel);

  const [mode, setMode] = useState<'pro' | 'guided'>('guided');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [s, a] = await Promise.all([getRecentSessions(5), getAchievements()]);
    setSessions(s);
    setAchievements(a);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const quickActions = QUICK_ACTIONS[profileType] ?? QUICK_ACTIONS.wellness;

  const handleQuickAction = (id: string) => {
    navigation.navigate('Sessions', { screen: 'SessionConfig', params: { quickAction: id } });
  };

  return (
    <SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'} 👋</Text>
          <Text style={styles.subtitle}>Let's make progress today</Text>
        </View>

        <ModeSwitcher mode={mode} onToggle={setMode} />
        <QuickActionsPanel actions={quickActions} onAction={handleQuickAction} />
        <DeviceStatusWidget deviceName={deviceName} status={deviceStatus} battery={battery} />
        <RecentSessionsWidget sessions={sessions} onViewAll={() => navigation.navigate('Sessions')} />
        <AchievementWidget achievements={achievements} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  header: { marginBottom: theme.spacing.lg },
  greeting: { ...theme.typography.h2, color: theme.colors.text.primary },
  subtitle: { ...theme.typography.body, color: theme.colors.text.secondary, marginTop: 2 },
});
