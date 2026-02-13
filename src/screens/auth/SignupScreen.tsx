import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import SafeAreaView from '../../components/common/SafeAreaView';
import { useAuth } from '../../store/hooks/useAuth';
import { isValidEmail, isValidPassword, doPasswordsMatch } from '../../utils/validators';
import { logEvent } from '../../services/analytics/analyticsService';

export default function SignupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signup, loading, error, dismissError } = useAuth();

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!isValidEmail(email)) e.email = 'Please enter a valid email';
    if (!isValidPassword(password)) e.password = 'Password must be at least 8 characters';
    if (!doPasswordsMatch(password, confirmPassword)) e.confirmPassword = 'Passwords do not match';
    if (!termsAccepted) e.terms = 'You must accept the Terms & Conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    dismissError();
    try {
      await signup(email, password, name);
      logEvent('signup');
    } catch {
      // handled by Redux
    }
  };

  return (
    <SafeAreaView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join SmartHeal and start your healing journey</Text>

          <Input label="Full Name" value={name} onChangeText={setName} placeholder="John Doe" error={errors.name} />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min 8 characters"
            secureTextEntry
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat password"
            secureTextEntry
            error={errors.confirmPassword}
          />

          <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAccepted(!termsAccepted)}>
            <View style={[styles.checkbox, termsAccepted && styles.checked]}>
              {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>I accept the Terms & Conditions</Text>
          </TouchableOpacity>
          {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button title="Sign Up" onPress={handleSignup} loading={loading} size="lg" style={styles.button} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl },
  title: { ...theme.typography.h1, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.body, color: theme.colors.text.secondary, marginBottom: theme.spacing.xl },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginVertical: theme.spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  checked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  termsText: { color: theme.colors.text.secondary, fontSize: 14 },
  errorText: { color: theme.colors.error, fontSize: 12, marginBottom: theme.spacing.sm },
  button: { marginTop: theme.spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.lg },
  footerText: { color: theme.colors.text.secondary },
  loginLink: { color: theme.colors.primary, fontWeight: '600' },
});
