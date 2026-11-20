/**
 * DeviceScreen - "Device" dock tab: Bluetooth scan / connect / disconnect + live metrics.
 * Uses the same BLE service as before (services/bleService.ts).
 */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Device, State } from 'react-native-ble-plx';

import TabHeader from '../../../components/layout/TabHeader';
import AppText from '../../../components/ui/AppText';
import Card from '../../../components/ui/Card';
import Touchable from '../../../components/ui/Touchable';
import { Pill, SectionHeader } from '../../../components/ui/Bits';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Buttons';
import { useAppModal } from '../../../components/feedback/AppModalProvider';
import SimulatorCard from './SimulatorCard';
import {
  connectAndSync,
  disconnectBleDevice,
  enableBluetooth,
  requestBlePermissions,
  setMotor,
  startBleScan,
  stopBleScan,
  useBleSnapshot,
  ESP32_SERVICE,
} from '../../../services/bleService';
import { fonts, radius, DOCK_SPACE, useTheme, useStyles } from '../../../theme';
import type { Palette } from '../../../theme';

const displayName = (d: Device) => d.name || d.localName || 'Unnamed device';

/** rough signal strength from RSSI */
const signalIcon = (rssi?: number | null) =>
  rssi == null ? 'signal-off' : rssi > -60 ? 'signal-cellular-3' : rssi > -75 ? 'signal-cellular-2' : 'signal-cellular-1';

function RadarPulse({ active }: { active: boolean }) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.radar}>
      <View style={[styles.radarCore, { backgroundColor: active ? colors.primary : colors.ink }]}>
        {active ? <ActivityIndicator color="#FFFFFF" size="large" /> : <Icon name="bluetooth" size={34} color={colors.onInk} />}
      </View>
    </View>
  );
}

export default function DeviceScreen(_: { active: boolean }) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const modal = useAppModal();
  const { bluetoothState, connectedDevice, heartRate, pulseBpm, pulseSignal, batteryLevel, stepCount, motorEnabled, motorIntensity } = useBleSnapshot();
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const devicesRef = useRef<Device[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'empty' | 'error'>('idle');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [motorBusy, setMotorBusy] = useState(false);

  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  // ask for permissions + turn Bluetooth on the first time this tab opens
  useEffect(() => {
    (async () => {
      try {
        if (await requestBlePermissions()) await enableBluetooth();
      } catch {
        setScanStatus('error');
      }
    })();
    return () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      stopBleScan();
    };
  }, []);

  const stopScan = (reason: 'timeout' | 'manual' = 'timeout') => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    stopBleScan();
    setScanning(false);
    setScanStatus(reason === 'timeout' && devicesRef.current.length === 0 ? 'empty' : 'idle');
  };

  const startScan = async () => {
    if (!(await requestBlePermissions())) {
      setScanStatus('error');
      modal.alert({ type: 'warning', icon: 'bluetooth-off', title: 'Permission needed', message: 'Allow Bluetooth access to find your SmartHeal device.' });
      return;
    }
    try {
      await enableBluetooth();
    } catch {
      setScanStatus('error');
      modal.alert({ type: 'warning', icon: 'bluetooth-off', title: 'Bluetooth is off', message: 'Please turn on Bluetooth to discover your device.' });
      return;
    }
    setDevices([]);
    setScanning(true);
    setScanStatus('scanning');
    startBleScan(device => {
      setDevices(current => (current.some(d => d.id === device.id) ? current : [...current, device]));
    }, [ESP32_SERVICE]);
    scanTimeoutRef.current = setTimeout(() => stopScan('timeout'), 10000);
  };

  const connect = async (device: Device) => {
    try {
      setConnectingId(device.id);
      stopScan('manual');
      await connectAndSync(device);
      modal.toast({ type: 'success', title: 'Device connected', message: displayName(device) });
    } catch (error: any) {
      modal.alert({ type: 'error', title: 'Connection failed', message: error?.message || 'Unable to connect to this device.' });
    } finally {
      setConnectingId(null);
    }
  };

  const disconnect = async () => {
    const ok = await modal.confirm({ title: 'Disconnect device?', message: 'Live data will stop syncing.', confirmLabel: 'Disconnect', destructive: true, icon: 'bluetooth-off' });
    if (!ok) return;
    try {
      await disconnectBleDevice();
      modal.toast({ type: 'info', title: 'Device disconnected' });
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Could not disconnect', message: e?.message });
    }
  };

  const updateMotor = async (enabled: boolean, intensity = motorIntensity) => {
    try {
      setMotorBusy(true);
      await setMotor(enabled, intensity);
    } catch (error: any) {
      modal.alert({ type: 'error', title: 'Motor control failed', message: error?.message || 'Unable to send the motor command.' });
    } finally {
      setMotorBusy(false);
    }
  };

  const btReady = bluetoothState === State.PoweredOn;
  const sorted = [...devices].sort((x, y) => (y.rssi ?? -999) - (x.rssi ?? -999));

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]} showsVerticalScrollIndicator={false}>
      <TabHeader kicker="Bluetooth" title="My Device" subtitle="Connect your SmartHeal therapy device or watch." />

      {connectedDevice ? (
        <View>
          <Card style={styles.connected} tint={colors.primarySoft}>
            <View style={styles.connRow}>
              <View style={styles.connIcon}>
                <Icon name="bluetooth-connect" size={28} color="#FFF" />
              </View>
              <View style={styles.flex}>
                <Pill text="Connected" icon="check-circle" color={colors.success} />
                <AppText style={styles.connName} numberOfLines={1}>
                  {displayName(connectedDevice)}
                </AppText>
                <AppText variant="small" tone="muted" numberOfLines={1}>
                  {connectedDevice.id}
                </AppText>
              </View>
            </View>
            <View style={styles.liveGrid}>
              <Live icon="pulse" label="Pulse sensor" value={pulseBpm != null ? `${pulseBpm}` : '--'} unit="bpm" />
              <Live icon="heart-pulse" label="Heart rate" value={heartRate != null ? `${heartRate}` : '--'} unit="bpm" />
              <Live icon="battery-charging-70" label="Battery" value={batteryLevel != null ? `${batteryLevel}` : '--'} unit="%" />
              <Live icon="shoe-print" label="Steps" value={stepCount != null ? stepCount.toLocaleString() : '--'} />
            </View>
            <View style={styles.motorCard}>
              <View style={styles.motorHeader}>
                <View style={styles.motorTitleRow}>
                  <Icon name="vibrate" size={22} color={colors.primary} />
                  <View style={styles.motorTitle}>
                    <AppText style={styles.motorName}>Vibration motor</AppText>
                    <AppText variant="small" tone="muted">
                      {motorEnabled ? `Intensity ${motorIntensity}%` : 'Off'}
                    </AppText>
                  </View>
                </View>
                <Switch
                  value={motorEnabled}
                  disabled={motorBusy}
                  onValueChange={enabled => updateMotor(enabled, enabled ? Math.max(motorIntensity, 80) : 0)}
                  trackColor={{ false: colors.surfaceStrong, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.motorControls}>
                <Touchable
                  disabled={motorBusy || !motorEnabled || motorIntensity <= 0}
                  onPress={() => updateMotor(true, motorIntensity - 10)}
                  style={styles.motorAdjust}
                >
                  <Icon name="minus" size={22} color={colors.text} />
                </Touchable>
                <View style={styles.intensityTrack}>
                  <View style={[styles.intensityFill, { width: `${motorEnabled ? motorIntensity : 0}%`, backgroundColor: colors.primary }]} />
                </View>
                <Touchable
                  disabled={motorBusy || !motorEnabled || motorIntensity >= 100}
                  onPress={() => updateMotor(true, motorIntensity + 10)}
                  style={styles.motorAdjust}
                >
                  <Icon name="plus" size={22} color={colors.text} />
                </Touchable>
              </View>
              <AppText variant="small" tone="muted" style={styles.signalText}>
                Sensor signal: {pulseSignal != null ? pulseSignal : '--'}
              </AppText>
            </View>
            <SecondaryButton title="Disconnect" icon="link-variant-off" onPress={disconnect} compact style={styles.disconnect} />
          </Card>
        </View>
      ) : (
        <View>
          <Card style={styles.scanCard}>
            <RadarPulse active={scanning} />
            <AppText variant="h3" center style={styles.scanTitle}>
              {scanning ? 'Searching nearby…' : scanStatus === 'empty' ? 'No devices found' : 'Ready to connect'}
            </AppText>
            <AppText variant="small" tone="muted" center style={styles.scanSub}>
              {scanning
                ? 'Keep your device switched on and close to the phone.'
                : scanStatus === 'empty'
                ? 'Make sure the device is on and in pairing mode, then try again.'
                : 'Turn on your SmartHeal device and tap scan.'}
            </AppText>
            <View style={styles.btRow}>
              <View style={[styles.btDot, { backgroundColor: btReady ? colors.success : colors.danger }]} />
              <AppText variant="small" tone="secondary">
                Bluetooth {btReady ? 'is on' : 'is off or unavailable'}
              </AppText>
            </View>
            {scanning ? (
              <SecondaryButton title="Stop scanning" icon="stop" onPress={() => stopScan('manual')} style={styles.scanBtn} />
            ) : (
              <PrimaryButton title={scanStatus === 'empty' ? 'Scan again' : 'Scan for devices'} icon="radar" onPress={startScan} style={styles.scanBtn} />
            )}
          </Card>
        </View>
      )}

      {!connectedDevice ? (
        <>
          <SectionHeader title="Nearby devices" action={devices.length ? `${devices.length} found` : undefined} />
          {sorted.length === 0 ? (
            <Card>
              <View style={styles.emptyRow}>
                <Icon name="bluetooth-audio" size={22} color={colors.textMuted} />
                <AppText variant="small" tone="muted" style={styles.emptyText}>
                  {scanning ? 'Looking for devices…' : 'Devices will appear here after a scan.'}
                </AppText>
              </View>
            </Card>
          ) : (
            sorted.map(d => (
              <View key={d.id}>
                <Touchable onPress={() => connect(d)} disabled={connectingId !== null}>
                  <View style={styles.deviceRow}>
                    <View style={styles.deviceIcon}>
                      <Icon name="access-point" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.flex}>
                      <AppText style={styles.deviceName} numberOfLines={1}>
                        {displayName(d)}
                      </AppText>
                      <AppText variant="small" tone="muted" numberOfLines={1}>
                        {d.id}
                      </AppText>
                    </View>
                    <Icon name={signalIcon(d.rssi)} size={18} color={colors.textSecondary} style={styles.signal} />
                    {connectingId === d.id ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <View style={styles.connectPill}>
                        <AppText style={styles.connectText}>Connect</AppText>
                      </View>
                    )}
                  </View>
                </Touchable>
              </View>
            ))
          )}
        </>
      ) : null}

      <SectionHeader title="Integrated device" />
      <SimulatorCard />

      <SectionHeader title="Good to know" />
      <Card>
        {[
          { icon: 'pulse', text: 'The ESP32 pulse sensor sends live BPM and signal data over Bluetooth.' },
          { icon: 'heart-pulse', text: 'Heart rate and battery sync automatically for devices that use standard Bluetooth health services.' },
          { icon: 'vibrate', text: 'Start the motor at a low intensity and increase slowly. Stop if you feel discomfort.' },
          { icon: 'map-marker-radius-outline', text: 'Stay within about 10 m of the device for a stable connection.' },
          { icon: 'shield-check-outline', text: 'Always start a therapy session at the lowest intensity and increase slowly.' },
        ].map((n, i) => (
          <View key={i} style={[styles.noteRow, i > 0 && styles.noteBorder]}>
            <Icon name={n.icon} size={18} color={colors.primary} />
            <AppText variant="small" tone="secondary" style={styles.noteText}>
              {n.text}
            </AppText>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

function Live({ icon, label, value, unit }: { icon: string; label: string; value: string; unit?: string }) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.live}>
      <Icon name={icon} size={20} color={colors.primary} />
      <AppText style={styles.liveValue}>
        {value}
        {unit ? (
          <AppText variant="small" tone="muted">
            {` ${unit}`}
          </AppText>
        ) : null}
      </AppText>
      <AppText variant="small" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: DOCK_SPACE },
  flex: { flex: 1 },

  scanCard: { marginTop: 20, alignItems: 'center', paddingVertical: 26 },
  radar: { height: 110, alignItems: 'center', justifyContent: 'center' },
  radarCore: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
  scanTitle: { marginTop: 8 },
  scanSub: { marginTop: 6, paddingHorizontal: 10 },
  btRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  btDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  scanBtn: { marginTop: 18, alignSelf: 'stretch' },

  connected: { marginTop: 20 },
  connRow: { flexDirection: 'row', alignItems: 'center' },
  connIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  connName: { fontFamily: fonts.bold, fontSize: 22, fontWeight: '700', marginTop: 6 },
  liveGrid: { flexDirection: 'row', marginTop: 18, gap: 8 },
  live: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  liveValue: { fontFamily: fonts.bold, fontSize: 22, fontWeight: '700', marginTop: 4 },
  disconnect: { marginTop: 16 },
  motorCard: { marginTop: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.background },
  motorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  motorTitleRow: { flexDirection: 'row', alignItems: 'center' },
  motorTitle: { marginLeft: 10 },
  motorName: { fontFamily: fonts.medium, fontWeight: '700' },
  motorControls: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  motorAdjust: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  intensityTrack: { flex: 1, height: 8, marginHorizontal: 12, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.surfaceStrong },
  intensityFill: { height: '100%', borderRadius: 4 },
  signalText: { marginTop: 10 },

  emptyRow: { flexDirection: 'row', alignItems: 'center' },
  emptyText: { marginLeft: 10, flex: 1 },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceName: { fontFamily: fonts.medium, fontWeight: '700', fontSize: 15 },
  signal: { marginHorizontal: 10 },
  connectPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primary },
  connectText: { fontFamily: fonts.medium, fontWeight: '700', fontSize: 13 },

  noteRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  noteBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  noteText: { flex: 1, marginLeft: 12, lineHeight: 19 },
});
