/**
 * VerifyOtpScreen - checks the 6-digit email code, creates the account, signs in, starts onboarding.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAuth, signInWithCustomToken } from '@react-native-firebase/auth';

import Screen from '../../components/layout/Screen';
import AppText from '../../components/ui/AppText';
import OtpInput from '../../components/ui/OtpInput';
import { ScreenHeader } from '../../components/ui/Bits';
import { PrimaryButton, TextButton } from '../../components/ui/Buttons';
import { useAppModal } from '../../components/feedback/AppModalProvider';
import { AuthService } from '../../services/authService';
import { useTheme, useStyles } from '../../theme';
import type { Palette } from '../../theme';
import { ScreenProps } from '../../navigation/types';

const EMPTY = ['', '', '', '', '', ''];
const RESEND_SECONDS = 30;

export default function VerifyOtpScreen({ navigation, route }: ScreenProps<'VerifyOtp'>) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { fullName, email, phone, password } = route.params;
  const modal = useAppModal();
  const [otp, setOtp] = useState<string[]>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const complete = otp.join('').length === 6;

  const verify = async () => {
    if (!complete) return;
    try {
      setLoading(true);
      const response = await AuthService.registerWithOTP({ email, password, otp: otp.join(''), fullName, phone });
      if (!response?.success) throw new Error(response?.message || 'Invalid OTP');
      if (!response?.user?.customToken) throw new Error('Account created but no login token was returned. Please log in.');

      // sign the new user into Firebase so onboarding can save their profile
      await signInWithCustomToken(getAuth(), response.user.customToken);

      modal.toast({ type: 'success', title: 'Email verified', message: 'Your account is ready' });
      navigation.reset({ index: 0, routes: [{ name: 'BasicInfo' }] });
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Verification failed', message: e?.message || 'Invalid or expired code.' });
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await AuthService.sendRegistrationOTP({ email, fullName, phone });
      setOtp(EMPTY);
      setSeconds(RESEND_SECONDS);
      modal.toast({ type: 'success', title: 'New code sent', message: email });
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Could not resend', message: e.message });
    }
  };

  return (
    <Screen header={<ScreenHeader onBack={() => navigation.goBack()} />}>
      <View style={styles.center}>
        <View style={styles.iconRing}>
          <Icon name="email-check-outline" size={38} color={colors.primary} />
        </View>
        <AppText variant="h1" center>
          Check your inbox
        </AppText>
        <AppText variant="body" tone="secondary" center style={styles.sub}>
          Enter the 6-digit code we sent to
        </AppText>
        <AppText variant="bodyStrong" center>
          {email}
        </AppText>
      </View>

      <View>
        <OtpInput value={otp} onChange={setOtp} editable={!loading} />
        <PrimaryButton title="Verify & continue" icon="shield-check-outline" onPress={verify} loading={loading} disabled={!complete} />
        {seconds > 0 ? (
          <AppText variant="small" tone="muted" center style={styles.resend}>
            Resend code in 0:{String(seconds).padStart(2, '0')}
          </AppText>
        ) : (
          <TextButton title="Resend code" onPress={resend} style={styles.resendBtn} />
        )}
        <TextButton title="Change email" tone="muted" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  center: { alignItems: 'center', marginTop: 20 },
  iconRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: 20,
  },
  sub: { marginTop: 8 },
  resend: { marginTop: 18 },
  resendBtn: { marginTop: 8 },
});
