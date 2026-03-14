import { getConnectedDevice } from './deviceConnection';
import ENV from '../../config/env';
import { DeviceStatus, BLE_STATUS_TYPES } from '../../models/Device';
import { decode as atob } from 'base-64';
import { Subscription } from 'react-native-ble-plx';

export function subscribeToDeviceStatus(
  callback: (status: DeviceStatus) => void,
  onError?: (error: Error) => void,
): Subscription | null {
  const device = getConnectedDevice();
  if (!device) {
    onError?.(new Error('No device connected'));
    return null;
  }

  return device.monitorCharacteristicForService(
    ENV.ble.serviceUUID,
    ENV.ble.statusCharUUID,
    (error, characteristic) => {
      if (error) {
        onError?.(new Error(error.message));
        return;
      }
      if (characteristic?.value) {
        const raw = atob(characteristic.value);
        const bytes = Array.from(raw).map((c) => (c as string).charCodeAt(0));

        if (bytes[1] === BLE_STATUS_TYPES.DEVICE_STATUS) {
          callback({
            mode: bytes[2],
            intensity: bytes[3],
            battery: bytes[4],
          });
        }
      }
    },
  );
}
