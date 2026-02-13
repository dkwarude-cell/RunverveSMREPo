import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { theme } from '../../styles/theme';
import { RootState } from '../../store';
import { useDevice } from '../../store/hooks/useDevice';
import ConnectionStatus from '../../components/device/ConnectionStatus';
import BatteryIndicator from '../../components/device/BatteryIndicator';
import Button from '../../components/common/Button';

interface Props { navigation: any; route: { params: { deviceId: string } } }

const DeviceDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { deviceId } = route.params;
  const { pairedDevices, connectedDevice, connect, disconnect } = useDevice();
  const device = pairedDevices.find(d => d.id === deviceId);
  const isConnected = connectedDevice?.id === deviceId;

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Device not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{device.name}</Text>
      <ConnectionStatus connected={isConnected} deviceName={device.name} />

      <View style={styles.infoCard}>
        <InfoRow label="Device ID" value={device.id} />
        <InfoRow label="Firmware" value={device.firmwareVersion || 'N/A'} />
        <InfoRow label="Model" value={device.model || 'SmartHeal'} />
      </View>

      {isConnected && device.batteryLevel != null && (
        <View style={styles.batterySection}>
          <Text style={styles.sectionTitle}>Battery</Text>
          <BatteryIndicator level={device.batteryLevel} />
        </View>
      )}

      <View style={styles.actions}>
        {isConnected ? (
          <Button title="Disconnect" variant="outline" onPress={disconnect} />
        ) : (
          <Button title="Connect" onPress={() => connect(deviceId)} />
        )}
        <Button title="Forget Device" variant="outline" onPress={() => { /* TODO: remove from paired */ navigation.goBack(); }} style={styles.forgetBtn} />
      </View>
    </ScrollView>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: theme.colors.text.secondary, fontSize: 16 },
  name: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
  infoCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginTop: theme.spacing.lg, ...theme.shadows.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  infoLabel: { color: theme.colors.text.secondary, fontSize: 14 },
  infoValue: { color: theme.colors.text.primary, fontSize: 14, fontWeight: '500', maxWidth: '60%' },
  batterySection: { marginTop: theme.spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
  actions: { marginTop: theme.spacing.xl, gap: theme.spacing.sm },
  forgetBtn: { borderColor: theme.colors.error },
});

export default DeviceDetailsScreen;
