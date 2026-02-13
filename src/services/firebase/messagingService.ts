/**
 * FCM Push Notifications service.
 * Uses Firebase Cloud Messaging via Expo Notifications in production.
 * Placeholder implementation – replace with real expo-notifications setup.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  // In production use expo-notifications:
  // const { status } = await Notifications.requestPermissionsAsync();
  // return status === 'granted';
  return true;
}

export async function getExpoPushToken(): Promise<string | null> {
  // const token = await Notifications.getExpoPushTokenAsync();
  // return token.data;
  return null;
}

export function onNotificationReceived(_callback: (notification: any) => void): () => void {
  // const subscription = Notifications.addNotificationReceivedListener(callback);
  // return () => subscription.remove();
  return () => {};
}
