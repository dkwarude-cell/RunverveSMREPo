import { connectToDevice, disconnectDevice, isDeviceConnected } from './bleManager';
import { Device } from 'react-native-ble-plx';

let connectedDevice: Device | null = null;

export async function connect(deviceId: string): Promise<Device> {
  connectedDevice = await connectToDevice(deviceId);
  return connectedDevice;
}

export async function disconnect(): Promise<void> {
  if (connectedDevice) {
    await disconnectDevice(connectedDevice.id);
    connectedDevice = null;
  }
}

export async function checkConnection(deviceId: string): Promise<boolean> {
  return isDeviceConnected(deviceId);
}

export function getConnectedDevice(): Device | null {
  return connectedDevice;
}

export async function discoverServices(device: Device): Promise<void> {
  await device.discoverAllServicesAndCharacteristics();
}
