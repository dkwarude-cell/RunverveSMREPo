import { Alert, Linking, Platform } from 'react-native';
import { Camera } from 'expo-camera';

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Camera Permission',
      'Camera access is required for AI placement guidance. Please enable it in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }
  return true;
}

export async function requestBluetoothPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Android 12+ requires BLUETOOTH_CONNECT and BLUETOOTH_SCAN
    // Handled by react-native-ble-plx internally
    return true;
  }
  return true;
}
