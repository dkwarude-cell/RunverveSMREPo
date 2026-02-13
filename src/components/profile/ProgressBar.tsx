import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface Props {
  progress: number; // 0-1
  color?: string;
  height?: number;
  label?: string;
  showPercent?: boolean;
}

const ProgressBar: React.FC<Props> = ({ progress, color = theme.colors.primary, height = 8, label, showPercent = true }) => {
  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  return (
    <View style={styles.container}>
      {(label || showPercent) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercent && <Text style={styles.percent}>{pct}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color, height }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13, color: theme.colors.text.secondary },
  percent: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary },
  track: { width: '100%', borderRadius: 99, backgroundColor: theme.colors.border, overflow: 'hidden' },
  fill: { borderRadius: 99 },
});

export default React.memo(ProgressBar);
