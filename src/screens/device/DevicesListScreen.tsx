import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { theme } from '../../styles/theme';
import { RootState } from '../../store';
import { useDevice } from '../../store/hooks/useDevice';
import ConnectionStatus from '../../components/device/ConnectionStatus';
import BatteryIndicator from '../../components/device/BatteryIndicator';
import Button from '../../components/common/Button';

interface Props { navigation: any }

const DevicesListScreen: React.FC<Props> = ({ navigation }) => {
  const { pairedDevices, connectedDevice, disconnect } = useDevice();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Devices</Text>

      {connectedDevice && (
        <View style={styles.activeCard}>
          <Text style={styles.activeLabel}>Active Device</Text>
          <Text style={styles.activeName}>{connectedDevice.name}</Text>
          <View style={styles.activeRow}>
            <ConnectionStatus connected deviceName={connectedDevice.name} />
            <BatteryIndicator level={connectedDevice.batteryLevel ?? 0} />
          </View>
          <Button title="Disconnect" variant="outline" onPress={disconnect} style={styles.disconnectBtn} />
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Paired Devices ({pairedDevices.length})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DeviceScan')}>
          <Text style={styles.scanLink}>+ Scan for new</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={pairedDevices}
        keyExtractor={d => d.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.deviceRow} onPress={() => navigation.navigate('DeviceDetails', { deviceId: item.id })}>
            <Text style={styles.deviceIcon}>🩹</Text>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.deviceId}>{item.id.slice(0, 17)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No paired devices. Tap "Scan for new" to get started.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.lg },
  activeCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.lg, ...theme.shadows.md },
  activeLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.primary, marginBottom: 4 },
  activeName: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
  activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  disconnectBtn: { marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
  scanLink: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  deviceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  deviceIcon: { fontSize: 28, marginRight: theme.spacing.sm },
  deviceInfo: {},
  deviceName: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
  deviceId: { fontSize: 12, color: theme.colors.text.disabled, marginTop: 2 },
  empty: { textAlign: 'center', color: theme.colors.text.secondary, marginTop: 40, paddingHorizontal: 24 },
});

export default DevicesListScreen;
