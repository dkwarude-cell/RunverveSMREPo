import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface Props { rssi: number }

const SignalStrength: React.FC<Props> = ({ rssi }) => {
  const bars = rssi > -50 ? 4 : rssi > -65 ? 3 : rssi > -80 ? 2 : 1;
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map(i => (
        <View
          key={i}
          style={[styles.bar, { height: 4 + i * 4 }, i <= bars ? styles.active : styles.inactive]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 4, borderRadius: 1 },
  active: { backgroundColor: theme.colors.success },
  inactive: { backgroundColor: theme.colors.border },
});

export default React.memo(SignalStrength);
