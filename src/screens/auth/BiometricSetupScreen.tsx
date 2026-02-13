import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import Button from '../../components/common/Button';
import SafeAreaView from '../../components/common/SafeAreaView';
import { checkBiometricAvailability, authenticateWithBiometrics } from '../../services/auth/biometricService';

export default function BiometricSetupScreen({ navigation }: any) {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBiometricAvailability().then((ok) => {
      setAvailable(ok);
      setLoading(false);
    });
  }, []);

  const handleEnable = async () => {
    const success = await authenticateWithBiometrics('Verify your identity to enable biometrics');
    if (success) {
      navigation.navigate('Main');
    }
  };

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Biometric Login</Text>
        <Text style={styles.subtitle}>
          {available
            ? 'Enable Face ID / Touch ID for quick access to SmartHeal.'
            : 'Biometric authentication is not available on this device.'}
        </Text>
        {available && (
          <Button title="Enable Biometrics" onPress={handleEnable} size="lg" style={styles.button} />
        )}
        <Button title="Skip" onPress={() => navigation.navigate('Main')} variant="text" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.lg },
  icon: { fontSize: 64, marginBottom: theme.spacing.lg },
  title: { ...theme.typography.h2, color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: theme.spacing.xl },
  button: { width: '100%', marginBottom: theme.spacing.md },
});
