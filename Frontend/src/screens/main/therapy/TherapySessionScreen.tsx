/**
 * TherapySessionScreen - guided session from an AI Scan report. The ITT device runs heat, vibration and TENS
 * at the same time, so all three start together and each stops at its own planned time; the session ends with the longest.
 *   check -> safety checklist + plan     live -> combined timer, pause / stop     done -> summary + pain check, saved to Firestore
 * The vibration motor is controlled through the connected device's Bluetooth protocol.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, Switch, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppText from '../../../components/ui/AppText';
import Card from '../../../components/ui/Card';
import Touchable from '../../../components/ui/Touchable';
import { ScreenHeader } from '../../../components/ui/Bits';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/Buttons';
import { ChipSelector } from '../../../components/ai/FormControls';
import { useAppModal } from '../../../components/feedback/AppModalProvider';
import { MotorPattern, setMotor, useBleConnectedDevice } from '../../../services/bleService';
import {
  startHeat,
  startTens,
  startVibration,
  setTensLevel,
  stopAll,
  stopHeat,
  stopTens,
  stopVibration,
  useDeviceSnapshot,
} from '../../../services/device/deviceService';
import { SessionService } from '../../../services/sessionService';
import { THERAPY_META, Therapy, therapyColor } from '../../../data/sampleStats';
import { prettyLabel } from '../../../utils/format';
import { radius, useTheme } from '../../../theme';
import { ScreenProps } from '../../../navigation/types';

type Phase = 'check' | 'live' | 'done';
type PlanItem = { type: Therapy; minutes: number; detail: string; settings: Record<string, string | number> };

/** The integrated patch carries 16 coin motors in a 4x4 grid; a session drives them all. */
const THERAPY_MOTORS = Array.from({ length: 16 }, (_, i) => i + 1);

const CHECKLIST = [
  'Device on the painful area, pod facing up',
  'Skin is clean and dry (no cream or oil)',
  'No open wound or fresh swelling under the pads',
  'TENS intensity starts at the lowest level',
];

const clock = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function TherapySessionScreen({ navigation, route }: ScreenProps<'TherapySession'>) {
  const { therapy: t, reportId, bodyPart, painBefore } = route.params;
  const { c } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const modal = useAppModal();
  const connectedDevice = useBleConnectedDevice();
  const { status: deviceStatus, telemetry } = useDeviceSnapshot();
  const deviceFaults = telemetry.faults ?? 0;
  /** The integrated device (simulator or hardware) is live and accepting commands. */
  const deviceReady = deviceStatus === 'connected';

  const plan = useMemo(() => {
    const items: PlanItem[] = [
      { type: 'heat', minutes: t.Heat_Duration_Min, detail: `${t.Heat_Setting} · ${t.Heat_Temperature_C} °C`, settings: { setting: t.Heat_Setting, temperatureC: t.Heat_Temperature_C } },
      {
        type: 'vibration',
        minutes: Math.max(1, Number(t.Vibration_Duration_Min) || 0),
        detail: `${t.Vibration_Frequency_Hz} Hz · ${t.Vibration_Amplitude_mm} mm · ${t.Vibration_Pattern}`,
        settings: { frequencyHz: t.Vibration_Frequency_Hz, amplitudeMm: t.Vibration_Amplitude_mm, pattern: t.Vibration_Pattern },
      },
      {
        type: 'tens',
        minutes: t.TENS_Duration_Min,
        detail: `${prettyLabel(t.TENS_Mode)} · ${t.TENS_Frequency_Hz} Hz · ${t.TENS_Pulse_Width_us} µs · ${prettyLabel(t.TENS_Electrode_Placement)} placement`,
        settings: { mode: t.TENS_Mode, frequencyHz: t.TENS_Frequency_Hz, pulseWidthUs: t.TENS_Pulse_Width_us, placement: t.TENS_Electrode_Placement },
      },
    ];
    return items;
  }, [t]);
  const totalSec = Math.max(...plan.map(p => p.minutes)) * 60;

  // Map the AI plan's vibration settings onto the ERM motor: rotation speed sets both
  // perceived frequency and amplitude, so frequency drives the base intensity and a
  // high amplitude (deep tissue) adds a boost; pulsed/intermittent patterns run as bursts.
  const motorPlan = useMemo(() => {
    const freqHz = Number(t.Vibration_Frequency_Hz) || 0;
    const amplitudeMm = Number(t.Vibration_Amplitude_mm) || 0;
    let intensity = Math.round(Math.max(35, Math.min(100, (freqHz / 150) * 100)));
    if (amplitudeMm >= 1) intensity = Math.min(100, intensity + 15);
    const pattern: MotorPattern = /puls|intermit|burst/i.test(String(t.Vibration_Pattern))
      ? 'pulsed'
      : 'continuous';
    return { intensity, pattern, pulsePeriodMs: 500 };
  }, [t]);

  const [phase, setPhase] = useState<Phase>('check');
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false));
  const [fastDemo, setFastDemo] = useState(false); // dev builds only: 1 min = 1 s so the whole flow can be tried quickly
  const [intensity, setIntensity] = useState(1);
  const [painAfter, setPainAfter] = useState<number>(painBefore ?? 5);
  const [endedEarly, setEndedEarly] = useState(false);
  const [saving, setSaving] = useState(false);

  // timer from timestamps (stays correct if the phone locks or the app goes to the background)
  const startedAt = useRef<string>('');
  const doneMs = useRef(0); // time counted before the current run
  const runStart = useRef<number | null>(null);
  const [, setTick] = useState(0);
  const speed = fastDemo ? 60 : 1;
  const running = runStart.current !== null;
  const elapsedSec = ((doneMs.current + (runStart.current ? Date.now() - runStart.current : 0)) / 1000) * speed;
  const motorState = useRef(false);
  const motorCommandInFlight = useRef(false);
  const requestedMotorState = useRef(false);

  const syncMotor = useCallback(async (enabled: boolean, force = false): Promise<boolean> => {
    requestedMotorState.current = enabled;
    if (!force && motorState.current === enabled) return true;
    if (motorCommandInFlight.current || !connectedDevice) return false;

    motorCommandInFlight.current = true;
    let commandSucceeded = false;
    try {
      await setMotor(enabled, motorPlan.intensity, {
        pattern: motorPlan.pattern,
        pulsePeriodMs: motorPlan.pulsePeriodMs,
      });
      motorState.current = enabled;
      commandSucceeded = true;
    } catch (error: any) {
      if (enabled) {
        modal.alert({
          type: 'error',
          title: 'Motor control failed',
          message: error?.message || 'Unable to send the motor command.',
        });
      }
    } finally {
      motorCommandInFlight.current = false;
      if (commandSucceeded && requestedMotorState.current !== motorState.current) {
        syncMotor(requestedMotorState.current).catch(() => undefined);
      }
    }
    return commandSucceeded;
  }, [connectedDevice, modal, motorPlan]);

  // Stopping never trusts the cached state: if a write was lost the phone can believe the
  // motor is already off while it is still running, and this is the command that stops it.
  const forceMotorOff = useCallback(() => {
    syncMotor(false, true).catch(() => undefined);
  }, [syncMotor]);

  const start = async () => {
    // Either device can run the session: the integrated device delivers all three
    // therapies, the ESP32 bench sketch only vibration.
    if (!connectedDevice && !deviceReady) {
      modal.alert({
        type: 'warning',
        title: 'Connect your device',
        message:
          'Connect the SmartHeal device or the simulator on the Device tab before starting therapy.',
      });
      return;
    }
    if (connectedDevice && !(await syncMotor(true))) return;
    startedAt.current = new Date().toISOString();
    doneMs.current = 0;
    runStart.current = Date.now();
    setPhase('live');
  };
  const pause = useCallback(() => {
    if (runStart.current) doneMs.current += Date.now() - runStart.current;
    runStart.current = null;
    forceMotorOff();
    setTick(x => x + 1);
  }, [forceMotorOff]);
  const resume = useCallback(() => {
    runStart.current = Date.now();
    syncMotor(true).catch(() => undefined);
    setTick(x => x + 1);
  }, [syncMotor]);

  useEffect(() => {
    if (phase !== 'live') return;
    const id = setInterval(() => setTick(x => x + 1), 500);
    return () => clearInterval(id);
  }, [phase]);

  // whole session finished
  useEffect(() => {
    if (phase === 'live' && elapsedSec >= totalSec) {
      pause();
      setPhase('done');
    }
  }, [phase, elapsedSec, totalSec, pause]);

  // elapsedSec is recomputed from the clock on every render, so the motor is driven off this
  // boolean instead: the effect then runs when the vibration actually starts or stops, not
  // several times a second.
  const vibrationShouldRun =
    phase === 'live' && running && elapsedSec < plan.find(item => item.type === 'vibration')!.minutes * 60;

  useEffect(() => {
    syncMotor(vibrationShouldRun).catch(() => undefined);
  }, [vibrationShouldRun, syncMotor]);

  // ── integrated device (heat + vibration + TENS) ──────────────────────────────
  // The ESP32 bench sketch drives one motor; when the integrated device is connected
  // each therapy in the plan runs on it and stops at its own planned time.
  const minutesFor = (type: Therapy) => plan.find(item => item.type === type)!.minutes * 60;
  const phaseRunning = (type: Therapy) =>
    phase === 'live' && running && elapsedSec < minutesFor(type);

  const heatShouldRun = phaseRunning('heat');
  const tensShouldRun = phaseRunning('tens');

  const onDeviceError = useCallback(
    (error: any, title: string) =>
      modal.alert({ type: 'error', title, message: error?.message || 'Device command failed.' }),
    [modal],
  );

  useEffect(() => {
    if (!deviceReady) return;
    try {
      if (heatShouldRun) startHeat(Number(t.Heat_Temperature_C) || 38);
      else stopHeat();
    } catch (error) {
      onDeviceError(error, 'Heat control failed');
    }
  }, [deviceReady, heatShouldRun, t.Heat_Temperature_C, onDeviceError]);

  useEffect(() => {
    if (!deviceReady) return;
    try {
      if (vibrationShouldRun) {
        startVibration({
          motors: THERAPY_MOTORS,
          intensity: motorPlan.intensity,
          effect: motorPlan.pattern === 'pulsed' ? 1 : 0,
          durationMs: 0, // runs until stopped, so the session owns the timing
        });
      } else {
        stopVibration();
      }
    } catch (error) {
      onDeviceError(error, 'Vibration control failed');
    }
  }, [deviceReady, vibrationShouldRun, motorPlan, onDeviceError]);

  useEffect(() => {
    if (!deviceReady) return;
    try {
      if (tensShouldRun) {
        startTens();
        setTensLevel(intensity);
      } else {
        stopTens();
      }
    } catch (error) {
      onDeviceError(error, 'TENS control failed');
    }
  }, [deviceReady, tensShouldRun, intensity, onDeviceError]);

  // Leaving the screen stops every output on the device as well as the bench motor.
  useEffect(() => () => stopAll(), []);

  // Leaving the screen must always stop the motor. The ref keeps this to a true unmount,
  // so a re-created syncMotor cannot cut a running session short.
  const forceMotorOffRef = useRef(forceMotorOff);
  forceMotorOffRef.current = forceMotorOff;
  useEffect(() => () => {
    requestedMotorState.current = false;
    forceMotorOffRef.current();
  }, []);

  const stop = useCallback(async () => {
    const ok = await modal.confirm({
      title: 'End session early?',
      message: `The ${Math.floor(elapsedSec / 60)} min you have completed will be saved.`,
      confirmLabel: 'End session',
      destructive: true,
      icon: 'stop-circle-outline',
    });
    if (!ok) return;
    pause();
    setEndedEarly(true);
    setPhase('done');
  }, [modal, elapsedSec, pause]);

  const leave = useCallback(async () => {
    const ok = await modal.confirm({ title: 'Leave without saving?', message: 'This session will not be added to your stats.', confirmLabel: 'Leave', destructive: true });
    if (ok) navigation.goBack();
  }, [modal, navigation]);

  // Android back: never lose a running session by accident
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'live') stop();
      else if (phase === 'done') leave();
      else return false;
      return true;
    });
    return () => sub.remove();
  }, [phase, stop, leave]);

  const completedMin = (p: PlanItem) => Math.min(p.minutes, Math.floor(elapsedSec / 60));
  const totalDoneMin = Math.floor(Math.min(elapsedSec, totalSec) / 60);

  const save = async () => {
    setSaving(true);
    try {
      await SessionService.save({
        startedAt: startedAt.current,
        reportId,
        bodyPart,
        durationMin: totalDoneMin,
        endedEarly,
        painBefore,
        painAfter,
        therapies: plan.map(p => ({ type: p.type, plannedMin: p.minutes, completedMin: endedEarly ? completedMin(p) : p.minutes, settings: p.type === 'tens' ? { ...p.settings, intensity } : p.settings })),
      });
      modal.toast({ type: 'success', title: 'Session saved', message: `${totalDoneMin} min of therapy added to your stats` });
      navigation.goBack();
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Could not save session', message: e?.message });
    } finally {
      setSaving(false);
    }
  };

  // ───────── check ─────────
  if (phase === 'check') {
    const allChecked = checked.every(Boolean);
    return (
      <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <ScreenHeader title="Before you start" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <AppText variant="h2">Your therapy plan</AppText>
          <AppText variant="body" tone="secondary" style={styles.lead}>
            Heat, vibration and TENS run together. Each one stops on its own; the session takes {totalSec / 60} min.
          </AppText>

          <Card style={styles.block}>
            {plan.map((p, i) => (
              <View key={p.type} style={[styles.planRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.divider }]}>
                <View style={[styles.planIcon, { backgroundColor: therapyColor(p.type, c) + '22' }]}>
                  <Icon name={THERAPY_META[p.type].icon} size={20} color={therapyColor(p.type, c)} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{THERAPY_META[p.type].label}</AppText>
                  <AppText variant="small" tone="secondary">
                    {p.detail}
                  </AppText>
                </View>
                <AppText variant="bodyStrong" style={styles.mins}>
                  {p.minutes} min
                </AppText>
              </View>
            ))}
          </Card>

          <AppText variant="h3" style={styles.sectionTitle}>
            Safety check
          </AppText>
          <Card padding={6} style={styles.block}>
            {CHECKLIST.map((item, i) => (
              <Touchable key={item} onPress={() => setChecked(v => v.map((x, j) => (j === i ? !x : x)))}>
                <View style={styles.checkRow}>
                  <Icon name={checked[i] ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={checked[i] ? c.primary : c.textMuted} />
                  <AppText variant="body" style={styles.checkText}>
                    {item}
                  </AppText>
                </View>
              </Touchable>
            ))}
          </Card>

          <View style={[styles.device, { backgroundColor: connectedDevice || deviceReady ? c.success + '1A' : c.surface }]}>
            <Icon name={connectedDevice || deviceReady ? 'bluetooth-connect' : 'bluetooth-off'} size={20} color={connectedDevice || deviceReady ? c.success : c.textSecondary} />
            <AppText variant="small" tone="secondary" style={styles.flex}>
              {connectedDevice
                ? `${connectedDevice.name || 'SmartHeal device'} is connected. The vibration motor will start with the session.`
                : deviceReady
                  ? 'Integrated device connected. Heat, vibration and TENS will all start with the session.'
                  : 'Connect your SmartHeal device or the simulator on the Device tab before starting therapy.'}
            </AppText>
          </View>

          {__DEV__ ? (
            <View style={styles.demoRow}>
              <AppText variant="small" tone="muted" style={styles.flex}>
                Fast demo: 1 min = 1 s (development builds only)
              </AppText>
              <Switch value={fastDemo} onValueChange={setFastDemo} trackColor={{ false: c.surfaceStrong, true: c.primary }} thumbColor="#FFFFFF" />
            </View>
          ) : null}

          <PrimaryButton title="Start session" icon="play" disabled={!allChecked} onPress={start} style={styles.cta} />
          {!allChecked ? (
            <AppText variant="small" tone="muted" center style={styles.hint}>
              Tick every item in the safety check to start.
            </AppText>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  // ───────── done ─────────
  if (phase === 'done') {
    return (
      <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.doneHead}>
            <View style={[styles.doneIcon, { backgroundColor: c.primary + '1A' }]}>
              <Icon name={endedEarly ? 'stop-circle-outline' : 'check-circle-outline'} size={44} color={c.primary} />
            </View>
            <AppText variant="h1" center>
              {endedEarly ? 'Session stopped' : 'Session complete'}
            </AppText>
            <AppText variant="body" tone="secondary" center>
              {totalDoneMin} min of therapy{bodyPart ? ` · ${prettyLabel(bodyPart)}` : ''}
            </AppText>
          </View>

          <Card style={styles.block}>
            {plan.map(p => {
              const done = endedEarly ? completedMin(p) : p.minutes;
              return (
                <View key={p.type} style={styles.sumRow}>
                  <AppText variant="bodyStrong" style={styles.sumLabel}>
                    {THERAPY_META[p.type].label}
                  </AppText>
                  <View style={[styles.track, { backgroundColor: c.surfaceStrong }]}>
                    <View style={[styles.fill, { width: `${(done / p.minutes) * 100}%`, backgroundColor: therapyColor(p.type, c) }]} />
                  </View>
                  <AppText variant="small" tone="secondary" style={styles.sumMin}>
                    {done}/{p.minutes} min
                  </AppText>
                </View>
              );
            })}
          </Card>

          <Card style={styles.block}>
            <ChipSelector label="How is your pain now?" value={painAfter} onChange={setPainAfter} min={0} max={10} lowText="No pain" highText="Worst" />
            {painBefore != null ? (
              <AppText variant="small" tone="muted" style={styles.before}>
                Before therapy (from your scan): {painBefore}/10
              </AppText>
            ) : null}
          </Card>

          <PrimaryButton title="Save session" icon="content-save-outline" loading={saving} onPress={save} style={styles.cta} />
          <SecondaryButton title="Discard" onPress={leave} style={styles.second} />
        </ScrollView>
      </View>
    );
  }

  // ───────── live ─────────
  // Responsive timer dimensions based on the available device width.
  const remaining = Math.max(0, totalSec - elapsedSec);
  const SIZE = Math.min(220, Math.max(140, windowWidth - 72));
  const STROKE = Math.max(8, Math.min(11, SIZE * 0.05));
  const CLOCK_FONT_SIZE = Math.min(40, Math.max(27, SIZE * 0.19));
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const progress = totalSec > 0
    ? Math.max(0, Math.min(1, remaining / totalSec))
    : 0;
  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.liveHeader}>
        <AppText variant="caption" tone="red">
          {running ? 'THERAPY RUNNING' : 'PAUSED'}
        </AppText>
        <AppText variant="h2">Therapy session</AppText>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.ringWrap}>
          <Svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
          >
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={c.surfaceStrong}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={c.primary}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${C} ${C}`}
              strokeDashoffset={C * (1 - progress)}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>

          <View style={[styles.ringCenter, { width: SIZE - 32 }]}>
            <AppText
              style={[
                styles.bigClock,
                {
                  color: c.text,
                  fontSize: CLOCK_FONT_SIZE,
                  lineHeight: CLOCK_FONT_SIZE * 1.2,
                },
              ]}
            >
              {clock(remaining)}
            </AppText>
            <AppText
              variant="small"
              tone="muted"
              style={styles.remainingText}
            >
              Remaining of {totalSec / 60} min
            </AppText>
          </View>
        </View>

        <Card style={styles.block}>
          {plan.map((p, i) => {
            const left = p.minutes * 60 - elapsedSec;
            const finished = left <= 0;
            const col = therapyColor(p.type, c);
            return (
              <View key={p.type} style={[styles.liveRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.divider }]}>
                <View style={styles.liveTop}>
                  <Icon name={THERAPY_META[p.type].icon} size={20} color={finished ? c.textMuted : col} />
                  <AppText variant="bodyStrong" style={styles.liveName}>
                    {THERAPY_META[p.type].label}
                  </AppText>
                  {finished ? (
                    <View style={styles.doneTag}>
                      <Icon name="check" size={16} color={c.success} />
                      <AppText variant="small" style={{ color: c.success }}>
                        Done
                      </AppText>
                    </View>
                  ) : (
                    <AppText style={[styles.rowClock, { color: c.text }]}>{clock(left)}</AppText>
                  )}
                </View>
                <AppText variant="small" tone="secondary">
                  {p.detail}
                </AppText>
                <View style={[styles.track, styles.liveTrack, { backgroundColor: c.surfaceStrong }]}>
                  <View style={[styles.fill, { width: `${Math.min(100, (elapsedSec / (p.minutes * 60)) * 100)}%`, backgroundColor: finished ? c.textMuted : col }]} />
                </View>
                {p.type === 'tens' && !finished ? (
                  <View style={styles.intensityRow}>
                    <AppText variant="small" tone="secondary" style={styles.flex}>
                      Intensity <AppText variant="small" style={styles.bold}>{intensity}/10</AppText> · aim for strong but comfortable
                    </AppText>
                    <Touchable onPress={() => setIntensity(v => Math.max(1, v - 1))} hitSlop={6}>
                      <View style={[styles.stepBtn, { backgroundColor: c.surfaceStrong }]}>
                        <Icon name="minus" size={18} color={c.text} />
                      </View>
                    </Touchable>
                    <Touchable onPress={() => setIntensity(v => Math.min(10, v + 1))} hitSlop={6}>
                      <View style={[styles.stepBtn, { backgroundColor: c.surfaceStrong }]}>
                        <Icon name="plus" size={18} color={c.text} />
                      </View>
                    </Touchable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>

        {deviceReady ? (
          <Card style={styles.block}>
            <View style={styles.deviceHead}>
              <Icon name="access-point" size={18} color={c.success} />
              <AppText variant="small" tone="secondary" style={styles.flex}>
                Live from the device
              </AppText>
              {deviceFaults !== 0 ? (
                <AppText variant="small" style={{ color: c.primary }}>
                  fault 0x{deviceFaults.toString(16).padStart(4, '0')}
                </AppText>
              ) : null}
            </View>
            <View style={styles.liveStrip}>
              <LiveStat
                label="Patch"
                value={telemetry.patchTempC == null ? '--' : `${telemetry.patchTempC.toFixed(1)}°`}
                hint={telemetry.setpointC == null ? 'heat off' : `target ${telemetry.setpointC.toFixed(0)}°`}
              />
              <LiveStat
                label="Heater"
                value={telemetry.heaterDutyPct == null ? '--' : `${telemetry.heaterDutyPct.toFixed(0)}%`}
                hint="duty"
              />
              <LiveStat
                label="Motors"
                value={telemetry.motorsActive == null ? '--' : String(telemetry.motorsActive)}
                hint="of 16"
              />
              <LiveStat
                label="TENS"
                value={telemetry.tensOn ? `L${telemetry.tensLevel ?? '?'}` : 'off'}
                hint={telemetry.tensQueued ? `${telemetry.tensQueued} queued` : 'unit'}
              />
            </View>
          </Card>
        ) : null}

        <View style={[styles.warn, { backgroundColor: c.primary + '12' }]}>
          <Icon name="alert-circle-outline" size={18} color={c.primary} />
          <AppText variant="small" tone="secondary" style={styles.flex}>
            Stop at once if you feel pain, burning or numbness.
          </AppText>
        </View>

        <View style={styles.controls}>
          <SecondaryButton title="Stop" icon="stop" onPress={stop} style={styles.flex} />
          <PrimaryButton title={running ? 'Pause' : 'Resume'} icon={running ? 'pause' : 'play'} onPress={running ? pause : resume} style={styles.flex} />
        </View>
      </ScrollView>
    </View>
  );
}

function LiveStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.liveStat, { backgroundColor: c.background }]}>
      <AppText variant="small" tone="muted">
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
      <AppText variant="small" tone="muted">
        {hint}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  lead: { marginTop: 6 },
  block: { marginTop: 14 },
  sectionTitle: { marginTop: 22 },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  planIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  mins: { fontVariant: ['tabular-nums'] },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, gap: 12 },
  checkText: { flex: 1 },
  device: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, marginTop: 16 },
  demoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  cta: { marginTop: 20 },
  second: { marginTop: 10 },
  hint: { marginTop: 8 },
  doneHead: { alignItems: 'center', gap: 6, marginTop: 24 },
  doneIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  sumRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  sumLabel: { width: 82 },
  sumMin: { width: 70, textAlign: 'right', fontVariant: ['tabular-nums'] },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  before: { marginTop: 8 },
  liveHeader: { paddingHorizontal: 20, paddingTop: 12 },
  ringWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 4,
  },
  bigClock: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  remainingText: { textAlign: 'center', marginTop: 4 },
  liveRow: { paddingVertical: 12, gap: 4 },
  liveTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveName: { flex: 1 },
  rowClock: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  doneTag: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  liveTrack: { flex: 0, marginTop: 6 },
  intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  deviceHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  liveStrip: { flexDirection: 'row', gap: 8 },
  liveStat: { flex: 1, paddingVertical: 8, paddingHorizontal: 8, borderRadius: radius.md, gap: 2 },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, marginTop: 14 },
  controls: { flexDirection: 'row', gap: 12, marginTop: 18 },
});
