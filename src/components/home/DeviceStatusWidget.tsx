import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import Card from '../common/Card';
import { ConnectionStatus } from '../../models/Device';

interface Props {
  deviceName?: string;
  status: ConnectionStatus;
  battery: number;
}

const DeviceStatusWidget: React.FC<Props> = ({ deviceName, status, battery }) => {
  const statusColor =
    status === 'connected' ? theme.colors.accent : status === 'connecting' ? theme.colors.warning : '#9CA3AF';

  return (
    <Card style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.heading}>Device</Text>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
      </View>
      {status === 'connected' ? (
        <>
          <Text style={styles.deviceName}>{deviceName ?? 'SmartHeal ITT'}</Text>
          <View style={styles.row}>
            <Text style={styles.statusText}>Connected</Text>
            <Text style={styles.battery}>🔋 {battery}%</Text>
          </View>
        </>
      ) : (
        <Text style={styles.statusText}>{status === 'connecting' ? 'Connecting...' : 'No device connected'}</Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { ...theme.typography.h3, color: theme.colors.text.primary },
  dot: { width: 10, height: 10, borderRadius: 5 },
  deviceName: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginVertical: 4 },
  statusText: { color: theme.colors.text.secondary, fontSize: 14 },
  battery: { color: theme.colors.text.secondary, fontSize: 14 },
});

export default React.memo(DeviceStatusWidget);
