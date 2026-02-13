import { BleManager as PlxBleManager, Device, State } from 'react-native-ble-plx';
import { DiscoveredDevice } from '../../models/Device';
import ENV from '../../config/env';
import { BLE_SCAN_DURATION, BLE_RSSI_THRESHOLD } from '../../utils/constants';

let manager: PlxBleManager | null = null;

export function getBleManager(): PlxBleManager {
  if (!manager) {
    manager = new PlxBleManager();
  }
  return manager;
}

export async function initialize(): Promise<void> {
  const mgr = getBleManager();
  const state = await mgr.state();
  if (state !== State.PoweredOn) {
    await new Promise<void>((resolve) => {
      const sub = mgr.onStateChange((newState) => {
        if (newState === State.PoweredOn) {
          sub.remove();
          resolve();
        }
      }, true);
    });
  }
}

export async function startScan(
  callback: (device: DiscoveredDevice) => void,
): Promise<void> {
  const mgr = getBleManager();
  mgr.startDeviceScan(
    [ENV.ble.serviceUUID],
    { allowDuplicates: false },
    (error, device) => {
      if (error) {
        console.error('BLE scan error:', error);
        return;
      }
      if (device && (device.rssi ?? -100) > BLE_RSSI_THRESHOLD) {
        callback({
          id: device.id,
          name: device.name,
          rssi: device.rssi ?? -100,
          serviceUUIDs: device.serviceUUIDs ?? [],
        });
      }
    },
  );

  // Auto-stop after scan duration
  setTimeout(() => {
    stopScan();
  }, BLE_SCAN_DURATION * 1000);
}

export function stopScan(): void {
  getBleManager().stopDeviceScan();
}

export async function connectToDevice(deviceId: string): Promise<Device> {
  const mgr = getBleManager();
  const device = await mgr.connectToDevice(deviceId);
  await device.discoverAllServicesAndCharacteristics();
  return device;
}

export async function disconnectDevice(deviceId: string): Promise<void> {
  const mgr = getBleManager();
  await mgr.cancelDeviceConnection(deviceId);
}

export function isDeviceConnected(deviceId: string): Promise<boolean> {
  return getBleManager().isDeviceConnected(deviceId);
}

export function destroy(): void {
  manager?.destroy();
  manager = null;
}
