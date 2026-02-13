import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../styles/theme';
import { useDevice } from '../../store/hooks/useDevice';
import Button from '../../components/common/Button';

interface Props { navigation: any; route: { params: { deviceId: string } } }

const DevicePairingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { deviceId } = route.params;
  const { connectedDevice } = useDevice();
  const [step, setStep] = useState<'connecting' | 'paired' | 'error'>('connecting');

  useEffect(() => {
    const t = setTimeout(() => {
      setStep(connectedDevice ? 'paired' : 'error');
    }, 2000);
    return () => clearTimeout(t);
  }, [connectedDevice]);

  return (
    <View style={styles.container}>
      {step === 'connecting' && (
        <>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.title}>Pairing...</Text>
          <Text style={styles.subtitle}>Connecting to your SmartHeal device</Text>
        </>
      )}

      {step === 'paired' && (
        <>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>Device Paired!</Text>
          <Text style={styles.subtitle}>Your device is ready to use.</Text>
          <Button title="Done" onPress={() => navigation.popToTop()} style={styles.btn} />
        </>
      )}

      {step === 'error' && (
        <>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Pairing Failed</Text>
          <Text style={styles.subtitle}>Could not connect. Make sure the device is nearby and powered on.</Text>
          <Button title="Try Again" onPress={() => { setStep('connecting'); }} style={styles.btn} />
          <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={styles.btn} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl },
  emoji: { fontSize: 64, marginBottom: theme.spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, marginTop: theme.spacing.md },
  subtitle: { fontSize: 15, color: theme.colors.text.secondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 24 },
  btn: { width: '100%', marginTop: theme.spacing.md },
});

export default DevicePairingScreen;
