import { getConnectedDevice } from './deviceConnection';
import ENV from '../../config/env';
import { BLE_COMMANDS } from '../../models/Device';
import { calculateChecksum } from '../../utils/helpers';
import { encode as btoa } from 'base-64';

async function writeCommand(bytes: number[]): Promise<void> {
  const device = getConnectedDevice();
  if (!device) throw new Error('No device connected');

  const checksum = calculateChecksum(bytes);
  const payload = [...bytes, checksum];
  const base64 = btoa(String.fromCharCode(...payload));

  await device.writeCharacteristicWithResponseForService(
    ENV.ble.serviceUUID,
    ENV.ble.commandCharUUID,
    base64,
  );
}

export async function sendStartCommand(duration: number, intensity: number): Promise<void> {
  await writeCommand([BLE_COMMANDS.START_BYTE, BLE_COMMANDS.START_SESSION, duration, intensity]);
}

export async function sendStopCommand(): Promise<void> {
  await writeCommand([BLE_COMMANDS.START_BYTE, BLE_COMMANDS.STOP_SESSION, 0x00, 0x00]);
}

export async function sendSetIntensityCommand(intensity: number): Promise<void> {
  await writeCommand([BLE_COMMANDS.START_BYTE, BLE_COMMANDS.SET_INTENSITY, intensity, 0x00]);
}

export async function sendPauseCommand(): Promise<void> {
  await writeCommand([BLE_COMMANDS.START_BYTE, BLE_COMMANDS.PAUSE_SESSION, 0x00, 0x00]);
}

export async function sendResumeCommand(): Promise<void> {
  await writeCommand([BLE_COMMANDS.START_BYTE, BLE_COMMANDS.RESUME_SESSION, 0x00, 0x00]);
}

export async function sendGetStatusCommand(): Promise<void> {
  await writeCommand([BLE_COMMANDS.START_BYTE, BLE_COMMANDS.GET_STATUS, 0x00, 0x00]);
}
