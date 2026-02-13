import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface Props { level: number } // 0-100

const BatteryIndicator: React.FC<Props> = ({ level }) => {
  const color = level > 50 ? theme.colors.success : level > 20 ? theme.colors.warning : theme.colors.error;
  return (
    <View style={styles.row}>
      <View style={styles.battery}>
        <View style={[styles.fill, { width: `${Math.min(level, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.label, { color }]}>{level}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  battery: { width: 32, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: theme.colors.text.secondary, overflow: 'hidden', marginRight: 6 },
  fill: { height: '100%', borderRadius: 1 },
  label: { fontSize: 12, fontWeight: '600' },
});

export default React.memo(BatteryIndicator);
