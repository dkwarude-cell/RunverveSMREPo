import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface Props {
  accuracy: number | null; // 0-100
  status: 'correct' | 'close' | 'incorrect' | 'unknown';
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  correct: { label: 'Perfect Placement', color: theme.colors.success, icon: '✅' },
  close: { label: 'Almost There', color: theme.colors.warning, icon: '🔶' },
  incorrect: { label: 'Adjust Position', color: theme.colors.error, icon: '❌' },
  unknown: { label: 'Detecting...', color: theme.colors.text.secondary, icon: '🔍' },
};

const PlacementValidation: React.FC<Props> = ({ accuracy, status }) => {
  const info = STATUS_MAP[status] || STATUS_MAP.unknown;

  return (
    <View style={[styles.container, { borderColor: info.color }]}>
      <Text style={styles.icon}>{info.icon}</Text>
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: info.color }]}>{info.label}</Text>
        {accuracy !== null && <Text style={styles.accuracy}>{accuracy}% accuracy</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 2, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md },
  icon: { fontSize: 24, marginRight: theme.spacing.sm },
  textCol: {},
  label: { fontWeight: '700', fontSize: 16 },
  accuracy: { color: theme.colors.text.secondary, fontSize: 13, marginTop: 2 },
});

export default React.memo(PlacementValidation);
