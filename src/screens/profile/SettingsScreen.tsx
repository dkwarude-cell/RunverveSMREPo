import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { theme } from '../../styles/theme';
import { RootState } from '../../store';
import { updateSetting } from '../../store/slices/settingsSlice';

interface Props { navigation: any }

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();
  const settings = useSelector((s: RootState) => s.settings);

  const toggle = (key: string) => {
    dispatch(updateSetting({ key, value: !(settings as any)[key] }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <Section title="Notifications">
        <ToggleRow label="Push Notifications" value={settings.notificationsEnabled} onToggle={() => toggle('notificationsEnabled')} />
        <ToggleRow label="Session Reminders" value={settings.sessionReminders} onToggle={() => toggle('sessionReminders')} />
      </Section>

      <Section title="Security">
        <ToggleRow label="Biometric Login" value={settings.biometricEnabled} onToggle={() => toggle('biometricEnabled')} />
      </Section>

      <Section title="Voice">
        <ToggleRow label="Voice Commands" value={settings.voiceEnabled} onToggle={() => toggle('voiceEnabled')} />
        <ToggleRow label="Haptic Feedback" value={settings.hapticFeedback} onToggle={() => toggle('hapticFeedback')} />
      </Section>

      <Section title="Data">
        <ToggleRow label="Auto-sync" value={settings.autoSync} onToggle={() => toggle('autoSync')} />
        <ToggleRow label="Analytics" value={settings.analyticsEnabled} onToggle={() => toggle('analyticsEnabled')} />
      </Section>
    </ScrollView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const ToggleRow: React.FC<{ label: string; value: boolean; onToggle: () => void }> = ({ label, value, onToggle }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch value={value} onValueChange={onToggle} trackColor={{ true: theme.colors.primary, false: theme.colors.border }} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.lg },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, overflow: 'hidden', ...theme.shadows.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: theme.spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  rowLabel: { fontSize: 15, color: theme.colors.text.primary },
});

export default SettingsScreen;
