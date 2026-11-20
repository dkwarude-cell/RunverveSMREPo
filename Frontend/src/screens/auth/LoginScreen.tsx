/**
 * LoginScreen - email/password or Google.
 * Logging in goes straight to the app (onboarding is only shown after sign-up).
 */
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';

import Screen from '../../components/layout/Screen';
import AppText from '../../components/ui/AppText';
import TextField from '../../components/ui/TextField';
import Logo from '../../components/ui/Logo';
import Touchable from '../../components/ui/Touchable';
import { ScreenHeader } from '../../components/ui/Bits';
import { PrimaryButton, TextButton } from '../../components/ui/Buttons';
import { useAppModal } from '../../components/feedback/AppModalProvider';
import { useUser } from '../../context/UserContext';
import { GoogleAuthService } from '../../services/googleAuthService';
import { firebaseAuthMessage } from '../../utils/validation';
import { fonts, useTheme, useStyles } from '../../theme';
import type { Palette } from '../../theme';
import { ScreenProps } from '../../navigation/types';
import ForgotPasswordSheet from './ForgotPasswordSheet';

// official Google "G" (download from Google's Sign-In branding guidelines)
const GOOGLE_G = require('../../assets/images/google-g.png');

export default function LoginScreen({ navigation, route }: ScreenProps<'Login'>) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const modal = useAppModal();
  const { refreshProfile } = useUser();
  const [email, setEmail] = useState(route.params?.prefilledEmail ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (route.params?.prefilledEmail) navigation.setParams({ prefilledEmail: undefined });
  }, [navigation, route.params?.prefilledEmail]);

  const goToApp = (name?: string | null) => {
    modal.toast({ type: 'success', title: 'Logged in', message: name ? `Welcome back, ${name.split(' ')[0]}` : 'Welcome back' });
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      modal.alert({ type: 'warning', title: 'Missing details', message: 'Please enter your email and password.' });
      return;
    }
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(getAuth(), email.trim(), password);
      const profile = await refreshProfile(); // also creates a basic profile on the backend if missing
      goToApp(profile?.fullName || result.user.displayName);
    } catch (error: any) {
      console.error('Login failed', error?.code, error?.message);
      modal.alert({ type: 'error', title: 'Login failed', message: firebaseAuthMessage(error, 'Unable to sign in') });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);
      const user = await GoogleAuthService.signIn();
      const profile = await refreshProfile();
      // a brand-new Google account has no health profile yet -> do the onboarding once
      const isNew = !profile?.onboardingComplete && !profile?.weightKg && !profile?.goals?.length;
      if (isNew) {
        modal.toast({ type: 'success', title: 'Account created', message: 'Let’s set up your profile' });
        navigation.reset({ index: 0, routes: [{ name: 'BasicInfo' }] });
      } else {
        goToApp(profile?.fullName || user.displayName);
      }
    } catch (error: any) {
      if (/cancel/i.test(error?.message ?? '')) return;
      modal.alert({ type: 'error', title: 'Google sign-in failed', message: firebaseAuthMessage(error, 'Unable to sign in with Google') });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Screen header={<ScreenHeader onBack={() => navigation.goBack()} />}>
      <View>
        <Logo size={44} />
        <AppText variant="h1" style={styles.title}>
          Welcome back
        </AppText>
        <AppText variant="body" tone="secondary">
          Log in to continue your recovery plan.
        </AppText>
      </View>

      <View style={styles.form}>
        <TextField
          label="Email address"
          icon="email-outline"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />
        <TextField
          label="Password"
          icon="lock-outline"
          placeholder="Your password"
          password
          value={password}
          onChangeText={setPassword}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
        <TextButton title="Forgot password?" onPress={() => setForgotOpen(true)} style={styles.forgot} />

        <PrimaryButton title="Log in" iconRight="arrow-right" onPress={handleLogin} loading={loading} disabled={googleLoading} />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <AppText variant="small" tone="muted" style={styles.dividerText}>
            or
          </AppText>
          <View style={styles.divider} />
        </View>

        <Touchable onPress={handleGoogle} disabled={googleLoading || loading}>
          <View style={styles.google}>
            <Image source={GOOGLE_G} style={styles.googleLogo} resizeMode="contain" />
            <AppText style={styles.googleText}>{googleLoading ? 'Connecting…' : 'Continue with Google'}</AppText>
          </View>
        </Touchable>
      </View>

      <View style={styles.footer}>
        <AppText variant="small" tone="secondary">
          New to SmartHeal?{' '}
        </AppText>
        <TextButton title="Create an account" onPress={() => navigation.replace('SignUp')} style={styles.inline} />
      </View>

      <ForgotPasswordSheet visible={forgotOpen} onClose={() => setForgotOpen(false)} initialEmail={email} />
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  title: { marginTop: 18, marginBottom: 6 },
  form: { marginTop: 28 },
  forgot: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 14 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  dividerText: { marginHorizontal: 12 },
  google: {
    height: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  googleLogo: { width: 20, height: 20 },
  googleText: { marginLeft: 10, fontFamily: fonts.medium, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', paddingTop: 28 },
  inline: { paddingVertical: 0, paddingHorizontal: 0 },
});