/**
 * deviceService - the SmartHeal integrated device (heat + vibration + TENS + sensors).
 *
 *   const { status, telemetry } = useDeviceSnapshot();
 *   await connectSimulator({ code: 'RXFY97', key });
 *   await startVibration({ motors: [1, 2], intensity: 60 });
 *
 * Transports: the Runverve simulator over its WebSocket relay today, and the physical
 * device over BLE once its GATT UUIDs are published. Both carry the same line protocol
 * (./protocol), so only the transport differs and the therapy calls below stay the same.
 *
 * The single-motor ESP32 bench sketch keeps its own service (../bleService); this one is
 * for the integrated hardware the therapy plan is written against.
 */
import { useSyncExternalStore } from 'react';

import {
  DeviceCommands,
  DeviceTelemetry,
  emptyTelemetry,
  hasFaults,
  VibrationCommand,
} from './protocol';
import { SimulatorCredentials, SimulatorLink, SimulatorStatus } from './simulatorLink';

export type DeviceTransport = 'simulator';

export type DeviceSnapshot = {
  transport: DeviceTransport | null;
  status: SimulatorStatus;
  /** Why the link failed or closed, when known. */
  detail?: string;
  telemetry: DeviceTelemetry;
  /** Most recent device lines, newest last, for the on-screen log. */
  log: string[];
};

const LOG_LIMIT = 60;
/** TENS levels are reached by queueing button presses, so stepping is not instant. */
export const TENS_MAX_LEVEL = 25;

const listeners = new Set<() => void>();
let snapshot: DeviceSnapshot = {
  transport: null,
  status: 'idle',
  telemetry: emptyTelemetry(),
  log: [],
};

const notify = () => listeners.forEach(listener => listener());

const update = (patch: Partial<DeviceSnapshot>) => {
  snapshot = { ...snapshot, ...patch };
  notify();
};

/**
 * The device sends telemetry about every 150 ms, which is far more often than any screen
 * needs to redraw. Updates are coalesced so subscribers re-render a few times a second
 * while the latest values are never lost.
 */
const TELEMETRY_THROTTLE_MS = 400;
let pendingTelemetry: DeviceTelemetry | null = null;
let telemetryTimer: ReturnType<typeof setTimeout> | null = null;

function publishTelemetry(telemetry: DeviceTelemetry) {
  pendingTelemetry = telemetry;
  if (telemetryTimer) return;
  telemetryTimer = setTimeout(() => {
    telemetryTimer = null;
    const next = pendingTelemetry;
    pendingTelemetry = null;
    if (next) update({ telemetry: next });
  }, TELEMETRY_THROTTLE_MS);
}

function cancelTelemetryPublish() {
  if (telemetryTimer) {
    clearTimeout(telemetryTimer);
    telemetryTimer = null;
  }
  pendingTelemetry = null;
}

const link = new SimulatorLink({
  onStatus: (status, detail) => {
    update({ status, detail });
    if (status === 'closed' || status === 'error') {
      cancelTelemetryPublish();
      update({ transport: null, telemetry: emptyTelemetry() });
    }
  },
  onTelemetry: publishTelemetry,
  onLine: line => {
    const log = [...snapshot.log, line];
    update({ log: log.length > LOG_LIMIT ? log.slice(-LOG_LIMIT) : log });
  },
});

export const subscribeToDevice = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getDeviceSnapshot = () => snapshot;

export const useDeviceSnapshot = () =>
  useSyncExternalStore(subscribeToDevice, getDeviceSnapshot, getDeviceSnapshot);

export const isDeviceConnected = () => link.isConnected;

export async function connectSimulator(credentials: SimulatorCredentials) {
  if (!credentials.code.trim() || !credentials.key.trim()) {
    throw new Error('Enter both the pairing code and the partner key.');
  }
  cancelTelemetryPublish();
  update({ transport: 'simulator', log: [], telemetry: emptyTelemetry() });
  link.connect(credentials);
}

export function disconnectDevice() {
  stopAll();
  cancelTelemetryPublish();
  link.disconnect();
  update({ transport: null, status: 'idle', telemetry: emptyTelemetry() });
}

/** Sends a raw command line; throws when nothing is connected. */
export function sendCommand(command: string) {
  if (!link.send(command)) {
    throw new Error('No device connected. Connect the simulator or the device first.');
  }
}

// ── therapy outputs ───────────────────────────────────────────────────────────

export type VibrationRequest = Omit<VibrationCommand, 'motor'> & {
  /** Motors to drive, 1-16. Each gets its own command line. */
  motors: number[];
};

export function startVibration({ motors, ...options }: VibrationRequest) {
  if (motors.length === 0) return;
  for (const motor of motors) {
    sendCommand(DeviceCommands.vibrate({ motor, ...options }));
  }
}

export const stopVibration = () => sendCommand(DeviceCommands.vibrationStop());

export const startHeat = (targetC: number) => sendCommand(DeviceCommands.heatOn(targetC));
export const stopHeat = () => sendCommand(DeviceCommands.heatOff());

export const startTens = () => sendCommand(DeviceCommands.tensOn());
export const stopTens = () => sendCommand(DeviceCommands.tensOff());
export const setTensMode = (mode: number) => sendCommand(DeviceCommands.tensMode(mode));
export const setTensLevel = (level: number) =>
  sendCommand(DeviceCommands.tensLevel(Math.max(0, Math.min(TENS_MAX_LEVEL, Math.round(level)))));
/** Re-reads the unit's real level when the firmware's belief has drifted. */
export const resyncTens = () => sendCommand(DeviceCommands.tensResync());

/** Stops every output. Safe to call when nothing is connected. */
export function stopAll() {
  try {
    sendCommand(DeviceCommands.stopAll());
  } catch {
    // nothing connected: there is nothing running to stop
  }
}

export const clearFaults = () => sendCommand(DeviceCommands.clearFaults());
export const requestStatus = () => sendCommand(DeviceCommands.status());

export { hasFaults };
