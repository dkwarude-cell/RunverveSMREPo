export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed';

export interface Device {
  id: string;
  userId: string;
  deviceName: string;
  name?: string;
  model?: string;
  batteryLevel?: number;
  serialNumber: string;
  firmwareVersion: string;
  pairedAt: number;
  lastConnected: number;
  autoReconnect: boolean;
}

export interface DiscoveredDevice {
  id: string;
  name: string | null;
  rssi: number;
  serviceUUIDs: string[];
}

export interface DeviceStatus {
  mode: number;
  intensity: number;
  battery: number;
}

export interface DeviceInfo {
  name: string;
  serialNumber: string;
  firmwareVersion: string;
  batteryLevel: number;
}

/** BLE Command bytes */
export const BLE_COMMANDS = {
  START_BYTE: 0xaa,
  STATUS_START_BYTE: 0xbb,
  START_SESSION: 0x01,
  STOP_SESSION: 0x02,
  SET_INTENSITY: 0x03,
  PAUSE_SESSION: 0x04,
  RESUME_SESSION: 0x05,
  GET_STATUS: 0x06,
} as const;

export const BLE_STATUS_TYPES = {
  DEVICE_STATUS: 0x01,
  SESSION_COMPLETE: 0x02,
  ERROR: 0xff,
} as const;
