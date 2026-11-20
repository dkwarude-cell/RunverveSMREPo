/**
 * SignUpScreen - collects name / email / phone / password and sends the email OTP.
 * Next: VerifyOtp -> onboarding.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Screen from '../../components/layout/Screen';
import AppText from '../../components/ui/AppText';
import TextField from '../../components/ui/TextField';
import { ScreenHeader } from '../../components/ui/Bits';
import { PrimaryButton, TextButton } from '../../components/ui/Buttons';
import { useAppModal } from '../../components/feedback/AppModalProvider';
import { AuthService } from '../../services/authService';
import { digitsOnly, isValidEmail, isValidPhone } from '../../utils/validation';
import { useTheme, useStyles } from '../../theme';
import type { Palette } from '../../theme';
import { ScreenProps } from '../../navigation/types';

export default function SignUpScreen({ navigation }: ScreenProps<'SignUp'>) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const modal = useAppModal();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Please enter your full name.';
    if (!isValidEmail(email)) return 'Please enter a valid email address.';
    if (!isValidPhone(phone)) return 'Please enter a valid 10-digit phone number.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    if (!agree) return 'Please accept the Terms of Service and Privacy Policy.';
    return null;
  };

  const handleSignUp = async () => {
    const problem = validate();
    if (problem) {
      modal.alert({ type: 'warning', title: 'Check your details', message: problem });
      return;
    }
    try {
      setLoading(true);
      await AuthService.sendRegistrationOTP({ email: email.trim(), fullName: fullName.trim(), phone: phone.trim() });
      modal.toast({ type: 'success', title: 'OTP sent', message: `Verification code sent to ${email.trim()}` });
      navigation.navigate('VerifyOtp', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Sign up failed', message: e.message || 'Could not create your account.' });
    } finally {
      setLoading(false);
    }
  };

  const showTerms = () =>
    modal.alert({
      type: 'info',
      icon: 'file-document-outline',
      title: 'Terms & Privacy',
      message:
        'SmartHeal stores your profile and health details securely in Firebase to personalise therapy. AI guidance is informational and not a medical diagnosis. You can ask us to delete your data at any time.',
    });

  return (
    <Screen header={<ScreenHeader onBack={() => navigation.goBack()} title="Create account" />}>
      <View>
        <AppText variant="h1">Let’s get you started</AppText>
        <AppText variant="body" tone="secondary" style={styles.sub}>
          Create your SmartHeal account. We’ll email you a code to verify it.
        </AppText>
      </View>

      <View style={styles.form}>
        <TextField label="Full name" icon="account-outline" placeholder="Your name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        <TextField
          label="Email address"
          icon="email-outline"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="Phone number"
          icon="phone-outline"
          placeholder="10-digit mobile number"
          value={phone}
          onChangeText={t => setPhone(digitsOnly(t))}
          keyboardType="phone-pad"
          maxLength={10}
        />
        <TextField label="Password" icon="lock-outline" placeholder="At least 6 characters" password value={password} onChangeText={setPassword} />
        {password ? (
          <View style={styles.strengthRow}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.strengthBar, i <= strength && { backgroundColor: strength === 1 ? colors.warning : colors.primary }]} />
            ))}
            <AppText variant="small" tone="muted" style={styles.strengthText}>
              {strength === 1 ? 'Too short' : strength === 2 ? 'Good' : 'Strong'}
            </AppText>
          </View>
        ) : null}
        <TextField label="Confirm password" icon="lock-check-outline" placeholder="Type it again" password value={confirm} onChangeText={setConfirm} />

        <Pressable style={styles.agreeRow} onPress={() => setAgree(a => !a)}>
          <View style={[styles.checkbox, agree && styles.checkboxOn]}>{agree ? <Icon name="check" size={16} color="#FFF" /> : null}</View>
          <AppText variant="small" tone="secondary" style={styles.agreeText}>
            I agree to the{' '}
            <AppText variant="small" tone="red" onPress={showTerms} style={styles.bold}>
              Terms of Service
            </AppText>{' '}
            and{' '}
            <AppText variant="small" tone="red" onPress={showTerms} style={styles.bold}>
              Privacy Policy
            </AppText>
          </AppText>
        </Pressable>

        <PrimaryButton title="Send verification code" iconRight="arrow-right" onPress={handleSignUp} loading={loading} />
      </View>

      <View style={styles.footer}>
        <AppText variant="small" tone="secondary">
          Already have an account?{' '}
        </AppText>
        <TextButton title="Log in" onPress={() => navigation.replace('Login')} style={styles.inline} />
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  sub: { marginTop: 6 },
  form: { marginTop: 24 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: -6, marginBottom: 14, paddingHorizontal: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceStrong, marginRight: 6 },
  strengthText: { marginLeft: 4, width: 64 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxOn: { backgroundColor: colors.primary },
  agreeText: { flex: 1 },
  bold: { fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', paddingTop: 24 },
  inline: { paddingVertical: 0, paddingHorizontal: 0 },
});
