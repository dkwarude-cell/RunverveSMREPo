import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { theme } from '../../styles/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import SafeAreaView from '../../components/common/SafeAreaView';
import { resetPassword } from '../../services/auth/authService';
import { isValidEmail } from '../../utils/validators';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      Alert.alert('Email Sent', 'Check your inbox for password reset instructions.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.message ?? 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />

        <Button title="Send Reset Link" onPress={handleReset} loading={loading} size="lg" style={styles.button} />
        <Button title="Back to Login" onPress={() => navigation.goBack()} variant="text" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: theme.spacing.lg, justifyContent: 'center' },
  title: { ...theme.typography.h1, color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body, color: theme.colors.text.secondary, marginBottom: theme.spacing.xl },
  button: { marginTop: theme.spacing.md, marginBottom: theme.spacing.md },
});
