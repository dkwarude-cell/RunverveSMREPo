import { useSyncExternalStore } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, State, Subscription } from 'react-native-ble-plx';

type BleSnapshot = {
  bluetoothState: State;
  connectedDevice: Device | null;
  heartRate: number | null;
  pulseBpm: number | null;
  pulseSignal: number | null;
  batteryLevel: number | null;
  stepCount: number | null;
  motorEnabled: boolean;
  motorIntensity: number;
};

const HEART_RATE_SERVICE = '180D';
const HEART_RATE_CHARACTERISTIC = '2A37';
const BATTERY_SERVICE = '180F';
const BATTERY_CHARACTERISTIC = '2A19';
// Step count is device-specific; replace these with the watch protocol UUIDs.
const STEP_COUNT_SERVICE = '';
const STEP_COUNT_CHARACTERISTIC = '';
export const ESP32_SERVICE = '7d2f0001-4f4a-4b2a-9c2b-6e8f1d2a0001';
export const ESP32_PULSE_CHARACTERISTIC = '7d2f0002-4f4a-4b2a-9c2b-6e8f1d2a0001';
export const ESP32_MOTOR_CHARACTERISTIC = '7d2f0003-4f4a-4b2a-9c2b-6e8f1d2a0001';

const manager = new BleManager();
const listeners = new Set<() => void>();
const subscriptions: Subscription[] = [];
let snapshot: BleSnapshot = {
  bluetoothState: State.Unknown,
  connectedDevice: null,
  heartRate: null,
  pulseBpm: null,
  pulseSignal: null,
  batteryLevel: null,
  stepCount: null,
  motorEnabled: false,
  motorIntensity: 0,
};

manager.onStateChange(state => {
  snapshot = { ...snapshot, bluetoothState: state };
  notify();
}, true);

const notify = () => {
  listeners.forEach(listener => listener());
};

export const bleManager = manager;

export const subscribeToBle = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getBleSnapshot = () => snapshot;

export const useBleSnapshot = () =>
  useSyncExternalStore(subscribeToBle, getBleSnapshot, getBleSnapshot);

const getConnectedDevice = () => snapshot.connectedDevice;

/**
 * Only the connected device, for screens that do not show live readings. The whole snapshot
 * is replaced on every pulse notification several times a second; this returns a stable
 * reference, so those updates no longer re-render the subscriber.
 */
export const useBleConnectedDevice = () =>
  useSyncExternalStore(subscribeToBle, getConnectedDevice, getConnectedDevice);

export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const permissions = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ];

  if (Platform.Version < 31) {
    permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  }

  const result = await PermissionsAndroid.requestMultiple(permissions);
  return permissions.every(
    permission => result[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );
}

export async function enableBluetooth(): Promise<void> {
  if (snapshot.bluetoothState === State.PoweredOn) return;

  if (Platform.OS === 'android' && typeof (manager as any).enable === 'function') {
    await (manager as any).enable();
  }

  await new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (snapshot.bluetoothState === State.PoweredOn) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - startedAt > 8000) {
        clearInterval(timer);
        reject(new Error('Bluetooth was not enabled'));
      }
    }, 200);
  });
}

export function startBleScan(onDevice: (device: Device) => void, serviceUUIDs?: string[]) {
  manager.startDeviceScan(serviceUUIDs ?? null, { allowDuplicates: false }, (error, device) => {
    if (!error && device) onDevice(device);
  });
}

export function stopBleScan() {
  manager.stopDeviceScan();
}

export async function connectAndSync(device: Device) {
  stopBleScan();
  clearSubscriptions();
  stopMotorKeepalive();

  const connected = await manager.connectToDevice(device.id);
  await connected.discoverAllServicesAndCharacteristics();
  snapshot = {
    ...snapshot,
    connectedDevice: connected,
    heartRate: null,
    pulseBpm: null,
    pulseSignal: null,
    batteryLevel: null,
    stepCount: null,
    motorEnabled: false,
    motorIntensity: 0,
  };
  notify();

  try {
    const battery = await connected.readCharacteristicForService(
      BATTERY_SERVICE,
      BATTERY_CHARACTERISTIC,
    );
    updateBattery(battery.value);
  } catch {
    // Battery support is optional for standard BLE devices.
  }

  try {
    const pulseSubscription = connected.monitorCharacteristicForService(
      ESP32_SERVICE,
      ESP32_PULSE_CHARACTERISTIC,
      (_error, characteristic) => updatePulse(characteristic?.value),
    );
    subscriptions.push(pulseSubscription);
  } catch {
    // Pulse notifications are available on the SmartHeal ESP32 firmware.
  }

  try {
    const batterySubscription = connected.monitorCharacteristicForService(
      BATTERY_SERVICE,
      BATTERY_CHARACTERISTIC,
      (_error, characteristic) => updateBattery(characteristic?.value),
    );
    subscriptions.push(batterySubscription);
  } catch {
    // Battery notifications are optional.
  }

  try {
    const heartRateSubscription = connected.monitorCharacteristicForService(
      HEART_RATE_SERVICE,
      HEART_RATE_CHARACTERISTIC,
      (_error, characteristic) => updateHeartRate(characteristic?.value),
    );
    subscriptions.push(heartRateSubscription);
  } catch {
    // Heart-rate notifications are optional.
  }

  if (STEP_COUNT_SERVICE && STEP_COUNT_CHARACTERISTIC) {
    try {
      const steps = await connected.readCharacteristicForService(
        STEP_COUNT_SERVICE,
        STEP_COUNT_CHARACTERISTIC,
      );
      updateStepCount(steps.value);

      const stepSubscription = connected.monitorCharacteristicForService(
        STEP_COUNT_SERVICE,
        STEP_COUNT_CHARACTERISTIC,
        (_error, characteristic) => updateStepCount(characteristic?.value),
      );
      subscriptions.push(stepSubscription);
    } catch {
      // Step-count support depends on the watch's proprietary protocol.
    }
  }

  manager.onDeviceDisconnected(connected.id, () => {
    stopMotorKeepalive();
    snapshot = {
      ...snapshot,
      connectedDevice: null,
      heartRate: null,
      pulseBpm: null,
      pulseSignal: null,
      batteryLevel: null,
      stepCount: null,
      motorEnabled: false,
      motorIntensity: 0,
    };
    notify();
  });

  return connected;
}

export async function disconnectBleDevice() {
  const device = snapshot.connectedDevice;
  clearSubscriptions();
  stopMotorKeepalive();
  if (device) await writeMotor(false, 0).catch(() => undefined);
  if (device) await manager.cancelDeviceConnection(device.id);
  snapshot = {
    ...snapshot,
    connectedDevice: null,
    heartRate: null,
    pulseBpm: null,
    pulseSignal: null,
    batteryLevel: null,
    stepCount: null,
    motorEnabled: false,
    motorIntensity: 0,
  };
  notify();
}

export type MotorPattern = 'continuous' | 'pulsed';

export type MotorOptions = {
  pattern?: MotorPattern;
  /** On/off burst time for the pulsed pattern, 100-25500 ms. */
  pulsePeriodMs?: number;
};

/**
 * The firmware stops the motor unless a command is renewed within a few seconds, so a crash,
 * a dropped link or a backgrounded app can never leave it vibrating. While the motor is meant
 * to run, this timer keeps renewing the command; it is cleared the moment the motor goes off.
 */
const MOTOR_KEEPALIVE_MS = 3000;
let motorKeepalive: ReturnType<typeof setInterval> | null = null;

function stopMotorKeepalive() {
  if (motorKeepalive) {
    clearInterval(motorKeepalive);
    motorKeepalive = null;
  }
}

async function writeMotor(enabled: boolean, safeIntensity: number, options?: MotorOptions) {
  const device = snapshot.connectedDevice;
  if (!device) throw new Error('Connect the ESP32 before controlling the motor.');

  const pwmValue = Math.round((safeIntensity / 100) * 255);
  const mode = options?.pattern === 'pulsed' ? 1 : 0;
  const periodUnits = Math.max(1, Math.min(255, Math.round((options?.pulsePeriodMs ?? 500) / 100)));
  await device.writeCharacteristicWithResponseForService(
    ESP32_SERVICE,
    ESP32_MOTOR_CHARACTERISTIC,
    encodeBase64([enabled ? 1 : 0, pwmValue, mode, periodUnits]),
  );
}

export async function setMotor(enabled: boolean, intensity: number, options?: MotorOptions) {
  const safeIntensity = Math.max(0, Math.min(100, Math.round(intensity)));
  stopMotorKeepalive();
  await writeMotor(enabled, safeIntensity, options);

  if (enabled) {
    motorKeepalive = setInterval(() => {
      if (!snapshot.connectedDevice) {
        stopMotorKeepalive();
        return;
      }
      writeMotor(true, safeIntensity, options).catch(() => undefined);
    }, MOTOR_KEEPALIVE_MS);
  }

  snapshot = { ...snapshot, motorEnabled: enabled, motorIntensity: safeIntensity };
  notify();
}

function clearSubscriptions() {
  subscriptions.splice(0).forEach(subscription => subscription.remove());
}

function updateBattery(value?: string | null) {
  const bytes = decodeBase64(value);
  if (bytes.length === 0) return;
  snapshot = { ...snapshot, batteryLevel: Math.min(100, bytes[0]) };
  notify();
}

function updateHeartRate(value?: string | null) {
  const bytes = decodeBase64(value);
  if (bytes.length < 2) return;
  const is16Bit = (bytes[0] & 0x01) === 1;
  const heartRate = is16Bit ? bytes[1] | (bytes[2] << 8) : bytes[1];
  snapshot = { ...snapshot, heartRate };
  notify();
}

function updatePulse(value?: string | null) {
  const bytes = decodeBase64(value);
  if (bytes.length < 4) return;
  const pulseBpm = bytes[0] | (bytes[1] << 8);
  const pulseSignal = bytes[2] | (bytes[3] << 8);
  snapshot = { ...snapshot, pulseBpm: pulseBpm > 0 ? pulseBpm : null, pulseSignal };
  notify();
}

function updateStepCount(value?: string | null) {
  const bytes = decodeBase64(value);
  if (bytes.length < 4) return;
  const stepCount =
    bytes[0] +
    bytes[1] * 256 +
    bytes[2] * 65536 +
    bytes[3] * 16777216;
  snapshot = { ...snapshot, stepCount };
  notify();
}

function decodeBase64(value?: string | null): number[] {
  if (!value) return [];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const character of value) {
    if (character === '=') break;
    const digit = alphabet.indexOf(character);
    if (digit < 0) continue;
    buffer = (buffer << 6) | digit;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return bytes;
}

function encodeBase64(bytes: number[]): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const remaining = bytes.length - index;
    const first = bytes[index];
    const second = remaining > 1 ? bytes[index + 1] : 0;
    const third = remaining > 2 ? bytes[index + 2] : 0;
    output += alphabet[first >> 2];
    output += alphabet[((first & 3) << 4) | (second >> 4)];
    output += remaining > 1 ? alphabet[((second & 15) << 2) | (third >> 6)] : '=';
    output += remaining > 2 ? alphabet[third & 63] : '=';
  }
  return output;
}
