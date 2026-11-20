/**
 * SmartHeal-Integrated protocol (firmware v0.2.0, proto=2).
 *
 * The device speaks one line-based text protocol on both transports: the USB/BLE serial
 * stream and the simulator's WebSocket relay. Commands go device-ward as single lines;
 * the device answers with `S:` telemetry (about every 150 ms), `I:` status and log lines.
 *
 * Telemetry MUST be read by key, never by position: the firmware is free to reorder keys
 * and to add new ones, so this parser keeps every pair it sees and maps the ones we know.
 */

export type VibrationEffect = number;

export type VibrationCommand = {
  /** 1-16. Motor 1 is bit 0 of the `vb` mask. */
  motor: number;
  /** Effect id; 0 is Continuous. */
  effect?: VibrationEffect;
  /** Milliseconds, 0 = run until stopped. */
  durationMs?: number;
  /** Percent, 0-100. */
  intensity?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(value)));

export const DeviceCommands = {
  vibrate: ({ motor, effect = 0, durationMs = 0, intensity = 60 }: VibrationCommand) =>
    `m:${clamp(motor, 1, 16)},e:${Math.max(0, Math.round(effect))},d:${Math.max(
      0,
      Math.round(durationMs),
    )},i:${clamp(intensity, 0, 100)}`,
  vibrationStop: () => 'vstop',
  heatOn: (targetC: number) => `h:${clamp(targetC, 0, 45)}`,
  heatOff: () => 'h:off',
  tensOn: () => 't:on',
  tensOff: () => 't:off',
  /** Re-syncs the firmware's believed TENS level with the unit's real LCD. */
  tensResync: () => 't:resync',
  tensMode: (mode: number) => `t:mode:${Math.max(0, Math.round(mode))}`,
  tensLevel: (level: number) => `t:lvl:${Math.max(0, Math.round(level))}`,
  /** Stops every output at once. */
  stopAll: () => 'STOP',
  /** Clears latched faults (only succeeds once the cause is gone). */
  clearFaults: () => 'clear',
  status: () => '?',
};


/**
 * Wire key names and scaling, taken from real `S:` lines:
 *   S:e=484,g=1677,ax=-33,ay=0,az=93,rl=3,pt=200,yw=-1040,t=3193,h=2964,
 *     hs=0,hp=0,vm=0,ts=0,f=0,vb=0000,tm=1,tl=0,tq=0
 * Accelerometer and temperatures are hundredths; orientation is tenths of a degree.
 */
const SCALE_HUNDREDTHS = 100;
const SCALE_TENTHS = 10;

/** Every key/value pair on one `S:`/`I:` line, untyped and in wire order. */
export type DeviceFields = Record<string, string>;

export type DeviceTelemetry = {
  /** EMG, raw ADC counts. */
  emg: number | null;
  /** EDA / GSR, raw ADC counts. */
  eda: number | null;
  /** Acceleration in g. */
  accel: { x: number; y: number; z: number } | null;
  /** Degrees. */
  orientation: { roll: number; pitch: number; yaw: number } | null;
  /** Skin temperature, °C (MAX30205). */
  skinTempC: number | null;
  /** Heating patch temperature, °C (thermistor). */
  patchTempC: number | null;
  /** Heater setpoint, °C; null when heating is off. */
  setpointC: number | null;
  /** Heater duty, percent. */
  heaterDutyPct: number | null;
  /** How many motors are driven right now. */
  motorsActive: number | null;
  /** Bitmask of driven motors; bit 0 is motor 1. */
  motorMask: number | null;
  tensOn: boolean | null;
  tensMode: number | null;
  /** The level the firmware *believes* the unit is at; `t:resync` corrects it. */
  tensLevel: number | null;
  /** Button presses still queued to the TENS unit. */
  tensQueued: number | null;
  /** Latched fault bits; 0 means healthy. */
  faults: number | null;
  fields: DeviceFields;
};

const num = (fields: DeviceFields, key: string, scale = 1): number | null => {
  const raw = fields[key];
  if (raw === undefined) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value / scale : null;
};

/** Parses a hex-ish field (`vb=0000`, `f=0`, `faults=0x0000`). */
const hex = (fields: DeviceFields, key: string): number | null => {
  const raw = fields[key];
  if (raw === undefined) return null;
  const value = parseInt(raw.replace(/^0x/i, ''), 16);
  return Number.isFinite(value) ? value : null;
};

/**
 * Splits a device line into key/value pairs. Accepts `S:` telemetry, `I:` status and bare
 * `key=value` runs; returns null for log lines that carry no pairs.
 */
export function parseDeviceLine(line: string): { kind: string; fields: DeviceFields } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const match = /^([A-Za-z]+):\s*(.*)$/.exec(trimmed);
  const kind = match ? match[1] : '';
  const body = match ? match[2] : trimmed;
  if (!body) return null;

  const fields: DeviceFields = {};
  for (const token of body.split(/[\s,]+/)) {
    const pair = /^([A-Za-z_][A-Za-z0-9_]*)[:=](.*)$/.exec(token);
    if (pair) fields[pair[1].toLowerCase()] = pair[2];
  }

  return Object.keys(fields).length > 0 ? { kind, fields } : null;
}

/** Merges a parsed line's fields onto the previous telemetry, keeping values not resent. */
export function readTelemetry(fields: DeviceFields, previous?: DeviceTelemetry): DeviceTelemetry {
  const merged: DeviceFields = { ...(previous?.fields ?? {}), ...fields };
  const ax = num(merged, 'ax', SCALE_HUNDREDTHS);
  const ay = num(merged, 'ay', SCALE_HUNDREDTHS);
  const az = num(merged, 'az', SCALE_HUNDREDTHS);
  const roll = num(merged, 'rl', SCALE_TENTHS);
  const pitch = num(merged, 'pt', SCALE_TENTHS);
  const yaw = num(merged, 'yw', SCALE_TENTHS);
  const setpoint = num(merged, 'hs', SCALE_HUNDREDTHS);
  const tens = merged.ts;

  return {
    emg: num(merged, 'e'),
    eda: num(merged, 'g'),
    accel: ax !== null && ay !== null && az !== null ? { x: ax, y: ay, z: az } : null,
    orientation: roll !== null && pitch !== null && yaw !== null ? { roll, pitch, yaw } : null,
    skinTempC: num(merged, 't', SCALE_HUNDREDTHS),
    patchTempC: num(merged, 'h', SCALE_HUNDREDTHS),
    // hs reads 0 while the heater is off, which is not a real setpoint.
    setpointC: setpoint ? setpoint : null,
    heaterDutyPct: num(merged, 'hp'),
    motorsActive: num(merged, 'vm'),
    motorMask: hex(merged, 'vb'),
    tensOn: tens === undefined ? null : tens !== '0' && tens !== 'off',
    tensMode: num(merged, 'tm'),
    tensLevel: num(merged, 'tl'),
    tensQueued: num(merged, 'tq'),
    faults: hex(merged, 'f') ?? hex(merged, 'faults'),
    fields: merged,
  };
}

export const emptyTelemetry = (): DeviceTelemetry => readTelemetry({});

/** True when the device has latched any fault. */
export const hasFaults = (telemetry: DeviceTelemetry) => (telemetry.faults ?? 0) !== 0;

/** Which motors the mask says are running, as 1-based numbers. */
export function activeMotors(telemetry: DeviceTelemetry): number[] {
  const mask = telemetry.motorMask ?? 0;
  const motors: number[] = [];
  for (let bit = 0; bit < 16; bit++) {
    if (mask & (1 << bit)) motors.push(bit + 1);
  }
  return motors;
}
