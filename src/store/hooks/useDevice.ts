import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '..';
import {
  connectDevice,
  setConnectionStatus,
  updateBattery,
  addDiscoveredDevice,
  setScanning,
  clearDiscoveredDevices,
  removePairedDevice,
} from '../slices/deviceSlice';
import * as bleManager from '../../services/ble/bleManager';
import * as deviceConnection from '../../services/ble/deviceConnection';
import { Device as DeviceModel } from '../../models/Device';

export function useDevice() {
  const dispatch = useDispatch<AppDispatch>();
  const { connectedDevice, connectionStatus, batteryLevel, pairedDevices, discoveredDevices, scanning } =
    useSelector((s: RootState) => s.device);

  const connect = useCallback(
    async (device: DeviceModel) => {
      try {
        dispatch(setConnectionStatus('connecting'));
        await deviceConnection.connect(device.id);
        dispatch(connectDevice(device));
      } catch {
        dispatch(setConnectionStatus('failed'));
      }
    },
    [dispatch],
  );

  const disconnect = useCallback(async () => {
    await deviceConnection.disconnect();
    dispatch(setConnectionStatus('disconnected'));
  }, [dispatch]);

  const startScan = useCallback(async () => {
    dispatch(clearDiscoveredDevices());
    dispatch(setScanning(true));
    await bleManager.startScan((device) => {
      dispatch(addDiscoveredDevice(device));
    });
  }, [dispatch]);

  const stopScan = useCallback(() => {
    bleManager.stopScan();
    dispatch(setScanning(false));
  }, [dispatch]);

  const unpair = useCallback(
    (deviceId: string) => {
      dispatch(removePairedDevice(deviceId));
    },
    [dispatch],
  );

  return {
    connectedDevice,
    connectionStatus,
    batteryLevel,
    pairedDevices,
    discoveredDevices,
    scanning,
    connect,
    disconnect,
    startScan,
    stopScan,
    unpair,
  };
}
