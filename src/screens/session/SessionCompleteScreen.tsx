import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../../styles/theme';
import { formatDuration, formatBodyArea } from '../../utils/formatters';
import Button from '../../components/common/Button';
import { SessionConfig } from '../../models/Session';

interface Props { navigation: any; route: { params: { config: SessionConfig; elapsedSeconds: number; intensity: number } } }

const STARS = [1, 2, 3, 4, 5];

const SessionCompleteScreen: React.FC<Props> = ({ navigation, route }) => {
  const { config, elapsedSeconds, intensity } = route.params;
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  const handleDone = () => {
    // In production, persist via sessionHistory / firestoreService
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Session Complete!</Text>

      <View style={styles.statsCard}>
        <StatRow label="Body Area" value={formatBodyArea(config.bodyArea)} />
        <StatRow label="Duration" value={formatDuration(elapsedSeconds)} />
        <StatRow label="Max Intensity" value={`${intensity} / 10`} />
        <StatRow label="Mode" value={config.mode.toUpperCase()} />
      </View>

      {/* Rating */}
      <Text style={styles.label}>How was this session?</Text>
      <View style={styles.stars}>
        {STARS.map(s => (
          <TouchableOpacity key={s} onPress={() => setRating(s)}>
            <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="How did it feel?"
        placeholderTextColor={theme.colors.text.disabled}
        multiline
        value={notes}
        onChangeText={setNotes}
        maxLength={500}
      />

      <Button title="Done" onPress={handleDone} style={styles.doneBtn} />
    </ScrollView>
  );
};

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, alignItems: 'center' },
  emoji: { fontSize: 56, marginTop: theme.spacing.xl },
  title: { fontSize: 26, fontWeight: '700', color: theme.colors.text.primary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg },
  statsCard: { width: '100%', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, ...theme.shadows.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  statLabel: { color: theme.colors.text.secondary, fontSize: 14 },
  statValue: { fontWeight: '600', fontSize: 14, color: theme.colors.text.primary, textTransform: 'capitalize' },
  label: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginTop: theme.spacing.lg, alignSelf: 'flex-start' },
  stars: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.sm },
  star: { fontSize: 36, color: theme.colors.border },
  starActive: { color: '#FFB800' },
  notesInput: {
    width: '100%', marginTop: theme.spacing.sm, backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md, minHeight: 80,
    textAlignVertical: 'top', fontSize: 14, color: theme.colors.text.primary,
  },
  doneBtn: { marginTop: theme.spacing.xl, width: '100%' },
});

export default SessionCompleteScreen;
