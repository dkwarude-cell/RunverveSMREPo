import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { theme } from '../../styles/theme';
import { useDevice } from '../../store/hooks/useDevice';
import DeviceCard from '../../components/device/DeviceCard';
import Button from '../../components/common/Button';

interface Props { navigation: any }

const DeviceScanScreen: React.FC<Props> = ({ navigation }) => {
  const { discoveredDevices, scanning, startScan, connect, pairedDevices } = useDevice();

  useEffect(() => { startScan(); }, []);

  const handleSelect = async (deviceId: string) => {
    const device = discoveredDevices.find(d => d.id === deviceId);
    if (device) {
      await connect({ id: device.id, userId: '', deviceName: device.name ?? 'Unknown', serialNumber: '', firmwareVersion: '', pairedAt: Date.now(), lastConnected: Date.now(), autoReconnect: false });
    }
    navigation.navigate('DevicePairing', { deviceId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanning for Devices</Text>
      {scanning && (
        <View style={styles.scanningRow}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.scanningText}>Searching nearby...</Text>
        </View>
      )}

      <FlatList
        data={discoveredDevices}
        keyExtractor={d => d.id}
        renderItem={({ item }) => (
          <DeviceCard device={item} onPress={() => handleSelect(item.id)} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !scanning ? <Text style={styles.empty}>No devices found. Make sure your SmartHeal device is turned on.</Text> : null
        }
      />

      <Button title={scanning ? 'Scanning...' : 'Scan Again'} onPress={startScan} disabled={scanning} style={styles.scanBtn} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.md },
  scanningRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  scanningText: { marginLeft: 8, color: theme.colors.text.secondary },
  list: { paddingBottom: 20 },
  empty: { textAlign: 'center', color: theme.colors.text.secondary, marginTop: 40, paddingHorizontal: 24 },
  scanBtn: { marginTop: theme.spacing.md },
});

export default DeviceScanScreen;
