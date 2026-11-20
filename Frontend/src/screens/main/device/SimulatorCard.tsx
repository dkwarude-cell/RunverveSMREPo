/**
 * SimulatorCard - connect to the SmartHeal integrated device through the Runverve
 * simulator relay, show its live telemetry, and drive each output for a quick bench check.
 *
 * The pairing code is printed on the simulator page and changes on every page load, so it
 * is typed in here rather than stored. The partner key is kept in memory only and is never
 * written to disk.
 */
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AppText from '../../../components/ui/AppText';
import Card from '../../../components/ui/Card';
import TextField from '../../../components/ui/TextField';
import Touchable from '../../../components/ui/Touchable';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Buttons';
import { useAppModal } from '../../../components/feedback/AppModalProvider';
import {
  clearFaults,
  connectSimulator,
  disconnectDevice,
  startHeat,
  startTens,
  startVibration,
  stopHeat,
  stopTens,
  stopVibration,
  useDeviceSnapshot,
} from '../../../services/device/deviceService';
import { activeMotors } from '../../../services/device/protocol';
import { radius, useTheme } from '../../../theme';

const STATUS_LABEL: Record<string, string> = {
  idle: 'Not connected',
  connecting: 'Connecting...',
  connected: 'Connected',
  error: 'Connection failed',
  closed: 'Disconnected',
};

const show = (value: number | null | undefined, digits = 0, unit = '') =>
  value == null ? '--' : `${value.toFixed(digits)}${unit}`;

export default function SimulatorCard() {
  const { c } = useTheme();
  const modal = useAppModal();
  const { status, detail, telemetry } = useDeviceSnapshot();
  const [code, setCode] = useState('');
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);

  const connected = status === 'connected';
  const faults = telemetry.faults ?? 0;
  const running = activeMotors(telemetry);

  const run = (action: () => void, failureTitle: string) => {
    try {
      action();
    } catch (error: any) {
      modal.alert({ type: 'error', title: failureTitle, message: error?.message });
    }
  };

  const connect = async () => {
    setBusy(true);
    try {
      await connectSimulator({ code, key });
    } catch (error: any) {
      modal.alert({ type: 'error', title: 'Could not connect', message: error?.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon name="monitor-cellphone" size={22} color={c.primary} />
        <View style={styles.headerText}>
          <AppText variant="bodyStrong">Device simulator</AppText>
          <AppText variant="small" tone="muted">
            {STATUS_LABEL[status] ?? status}
            {detail ? ` - ${detail}` : ''}
          </AppText>
        </View>
        {status === 'connecting' ? <ActivityIndicator color={c.primary} /> : null}
        <View
          style={[
            styles.dot,
            {
              backgroundColor:
                connected ? c.success : status === 'error' ? c.primary : c.textMuted,
            },
          ]}
        />
      </View>

      {!connected ? (
        <View style={styles.form}>
          <AppText variant="small" tone="secondary">
            Open the simulator page, then enter the pairing code it shows. That code changes
            every time the page reloads.
          </AppText>
          <TextField
            label="Pairing code"
            icon="key-outline"
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="e.g. RXFY97"
            value={code}
            onChangeText={setCode}
          />
          <TextField
            label="Partner key"
            icon="lock-outline"
            password
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="from Runverve"
            value={key}
            onChangeText={setKey}
          />
          <PrimaryButton
            title="Connect simulator"
            icon="lan-connect"
            loading={busy || status === 'connecting'}
            onPress={connect}
          />
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <Metric label="Skin" value={show(telemetry.skinTempC, 2, ' C')} />
            <Metric label="Patch" value={show(telemetry.patchTempC, 2, ' C')} />
            <Metric
              label="Setpoint"
              value={telemetry.setpointC == null ? 'off' : `${telemetry.setpointC.toFixed(0)} C`}
            />
            <Metric label="Heater" value={show(telemetry.heaterDutyPct, 0, ' %')} />
            <Metric label="Motors" value={show(telemetry.motorsActive)} />
            <Metric label="EMG" value={show(telemetry.emg)} />
            <Metric label="EDA" value={show(telemetry.eda)} />
            <Metric
              label="TENS"
              value={
                telemetry.tensOn == null
                  ? '--'
                  : telemetry.tensOn
                    ? `lvl ${telemetry.tensLevel ?? '?'}`
                    : 'off'
              }
            />
          </View>

          {running.length > 0 ? (
            <AppText variant="small" tone="secondary" style={styles.spaced}>
              Running: motor {running.join(', ')}
            </AppText>
          ) : null}

          {faults !== 0 ? (
            <Touchable onPress={() => run(clearFaults, 'Could not clear faults')}>
              <View style={[styles.fault, { backgroundColor: c.primary + '1A' }]}>
                <Icon name="alert-circle-outline" size={18} color={c.primary} />
                <AppText variant="small" style={{ color: c.primary }}>
                  Fault 0x{faults.toString(16).padStart(4, '0')} latched - tap to clear
                </AppText>
              </View>
            </Touchable>
          ) : null}

          <AppText variant="small" tone="muted" style={styles.spaced}>
            Bench test
          </AppText>
          <View style={styles.row}>
            <Chip
              label="Buzz 1-4"
              onPress={() =>
                run(
                  () => startVibration({ motors: [1, 2, 3, 4], intensity: 60, durationMs: 2000 }),
                  'Vibration failed',
                )
              }
            />
            <Chip label="Stop" onPress={() => run(stopVibration, 'Vibration stop failed')} />
            <Chip label="Heat 38" onPress={() => run(() => startHeat(38), 'Heat failed')} />
            <Chip label="Heat off" onPress={() => run(stopHeat, 'Heat off failed')} />
            <Chip label="TENS on" onPress={() => run(startTens, 'TENS failed')} />
            <Chip label="TENS off" onPress={() => run(stopTens, 'TENS off failed')} />
          </View>

          <SecondaryButton
            title="Disconnect"
            icon="lan-disconnect"
            onPress={() => {
              disconnectDevice();
              modal.toast({ type: 'info', title: 'Simulator disconnected' });
            }}
            style={styles.spaced}
          />
        </>
      )}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.metric, { backgroundColor: c.background }]}>
      <AppText variant="small" tone="muted">
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Touchable onPress={onPress}>
      <View style={[styles.chip, { backgroundColor: c.surfaceStrong }]}>
        <AppText variant="small">{label}</AppText>
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  form: { marginTop: 12, gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  metric: {
    flexGrow: 1,
    minWidth: 78,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.md },
  fault: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    marginTop: 12,
  },
  spaced: { marginTop: 14 },
});
