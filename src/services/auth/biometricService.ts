import * as LocalAuthentication from 'expo-local-authentication';

export async function checkBiometricAvailability(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function authenticateWithBiometrics(
  promptMessage = 'Authenticate to access SmartHeal',
): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: 'Use Passcode',
    cancelLabel: 'Cancel',
  });
  return result.success;
}

export async function getSupportedBiometricTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
  return LocalAuthentication.supportedAuthenticationTypesAsync();
}
