import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Device, ConnectionStatus, DeviceStatus, DiscoveredDevice } from '../../models/Device';

interface DeviceSliceState {
  pairedDevices: Device[];
  connectedDevice: Device | null;
  connectionStatus: ConnectionStatus;
  batteryLevel: number;
  discoveredDevices: DiscoveredDevice[];
  scanning: boolean;
}

const initialState: DeviceSliceState = {
  pairedDevices: [],
  connectedDevice: null,
  connectionStatus: 'disconnected',
  batteryLevel: 100,
  discoveredDevices: [],
  scanning: false,
};

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setPairedDevices(state, action: PayloadAction<Device[]>) {
      state.pairedDevices = action.payload;
    },
    addPairedDevice(state, action: PayloadAction<Device>) {
      state.pairedDevices.push(action.payload);
    },
    removePairedDevice(state, action: PayloadAction<string>) {
      state.pairedDevices = state.pairedDevices.filter((d) => d.id !== action.payload);
      if (state.connectedDevice?.id === action.payload) {
        state.connectedDevice = null;
        state.connectionStatus = 'disconnected';
      }
    },
    connectDevice(state, action: PayloadAction<Device>) {
      state.connectedDevice = action.payload;
      state.connectionStatus = 'connected';
    },
    setConnectionStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.connectionStatus = action.payload;
      if (action.payload === 'disconnected') {
        state.connectedDevice = null;
      }
    },
    updateBattery(state, action: PayloadAction<number>) {
      state.batteryLevel = action.payload;
    },
    updateDeviceStatus(state, action: PayloadAction<DeviceStatus>) {
      state.batteryLevel = action.payload.battery;
    },
    setDiscoveredDevices(state, action: PayloadAction<DiscoveredDevice[]>) {
      state.discoveredDevices = action.payload;
    },
    addDiscoveredDevice(state, action: PayloadAction<DiscoveredDevice>) {
      const exists = state.discoveredDevices.find((d) => d.id === action.payload.id);
      if (!exists) {
        state.discoveredDevices.push(action.payload);
      }
    },
    setScanning(state, action: PayloadAction<boolean>) {
      state.scanning = action.payload;
    },
    clearDiscoveredDevices(state) {
      state.discoveredDevices = [];
    },
  },
});

export const {
  setPairedDevices,
  addPairedDevice,
  removePairedDevice,
  connectDevice,
  setConnectionStatus,
  updateBattery,
  updateDeviceStatus,
  setDiscoveredDevices,
  addDiscoveredDevice,
  setScanning,
  clearDiscoveredDevices,
} = deviceSlice.actions;
export default deviceSlice.reducer;
