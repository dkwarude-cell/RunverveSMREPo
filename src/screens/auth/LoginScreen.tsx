import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SafeAreaView from '../../components/common/SafeAreaView';
import { useAuth } from '../../store/hooks/useAuth';
import { isValidEmail, isValidPassword } from '../../utils/validators';
import { logEvent } from '../../services/analytics/analyticsService';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, loading, error, dismissError } = useAuth();

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!isValidEmail(email)) newErrors.email = 'Please enter a valid email';
    if (!isValidPassword(password)) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    dismissError();
    try {
      await login(email, password);
      logEvent('login');
    } catch {
      // error handled by Redux
    }
  };

  return (
    <SafeAreaView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>SmartHeal</Text>
            <Text style={styles.subtitle}>by Runverve</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              accessibilityLabel="Email input"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
              accessibilityLabel="Password input"
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title="Log In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              size="lg"
              style={styles.loginButton}
            />

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.link}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  form: {
    marginBottom: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  loginButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  link: {
    color: theme.colors.primary,
    textAlign: 'center',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: theme.colors.text.secondary,
  },
  signupLink: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
