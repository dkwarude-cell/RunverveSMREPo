import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';
import { DiscoveredDevice } from '../../models/Device';
import SignalStrength from './SignalStrength';

interface Props {
  device: DiscoveredDevice;
  onPress?: () => void;
  isPaired?: boolean;
}

const DeviceCard: React.FC<Props> = ({ device, onPress, isPaired }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.iconCol}>
      <Text style={styles.icon}>🩹</Text>
    </View>
    <View style={styles.info}>
      <Text style={styles.name}>{device.name || 'Unknown Device'}</Text>
      <Text style={styles.id}>{device.id.slice(0, 17)}...</Text>
    </View>
    <View style={styles.right}>
      <SignalStrength rssi={device.rssi} />
      {isPaired && <Text style={styles.paired}>Paired</Text>}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.shadows.sm },
  iconCol: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.sm },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
  id: { fontSize: 12, color: theme.colors.text.disabled, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  paired: { fontSize: 11, color: theme.colors.success, fontWeight: '600', marginTop: 4 },
});

export default React.memo(DeviceCard);
