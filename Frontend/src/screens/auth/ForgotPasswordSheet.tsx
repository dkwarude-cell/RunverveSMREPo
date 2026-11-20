/**
 * ForgotPasswordSheet - 3 steps in one bottom sheet: email -> OTP -> new password.
 * Same backend calls as before (sendOTP, verifyotp, changepassword).
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Sheet from '../../components/ui/Sheet';
import TextField from '../../components/ui/TextField';
import OtpInput from '../../components/ui/OtpInput';
import AppText from '../../components/ui/AppText';
import { PrimaryButton, TextButton } from '../../components/ui/Buttons';
import { useAppModal } from '../../components/feedback/AppModalProvider';
import { AuthService } from '../../services/authService';
import { isValidEmail } from '../../utils/validation';

type Props = { visible: boolean; onClose: () => void; initialEmail?: string };

const EMPTY = ['', '', '', '', '', ''];

export default function ForgotPasswordSheet({ visible, onClose, initialEmail }: Props) {
  const modal = useAppModal();
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [otp, setOtp] = useState<string[]>(EMPTY);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  // pre-fill with whatever was typed on the login screen
  useEffect(() => {
    if (visible && initialEmail) setEmail(initialEmail);
  }, [visible, initialEmail]);

  const reset = () => {
    setStep('email');
    setOtp(EMPTY);
    setPassword('');
    setConfirm('');
    setLoading(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const sendOtp = async () => {
    if (!isValidEmail(email)) {
      modal.alert({ type: 'warning', title: 'Check your email', message: 'Please enter a valid email address.' });
      return;
    }
    try {
      setLoading(true);
      await AuthService.sendPasswordResetOTP(email.trim());
      modal.toast({ type: 'success', title: 'OTP sent', message: `Check ${email.trim()} for your code` });
      setStep('otp');
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Could not send OTP', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      modal.alert({ type: 'warning', title: 'Enter the code', message: 'Please enter all 6 digits.' });
      return;
    }
    try {
      setLoading(true);
      await AuthService.verifyPasswordResetOTP(email.trim(), code);
      setStep('password');
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Invalid code', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async () => {
    if (password.length < 6) {
      modal.alert({ type: 'warning', title: 'Weak password', message: 'Use at least 6 characters.' });
      return;
    }
    if (password !== confirm) {
      modal.alert({ type: 'warning', title: 'Passwords don’t match', message: 'Please type the same password twice.' });
      return;
    }
    try {
      setLoading(true);
      await AuthService.resetPassword(email.trim(), otp.join(''), password);
      close();
      modal.alert({
        type: 'success',
        title: 'Password updated',
        message: 'You can now log in with your new password.',
      });
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Reset failed', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    email: { t: 'Forgot password?', s: 'We’ll email you a 6-digit code to reset it.' },
    otp: { t: 'Enter the code', s: `Sent to ${email.trim()}` },
    password: { t: 'New password', s: 'Choose a password with at least 6 characters.' },
  }[step];

  return (
    <Sheet visible={visible} onClose={close} title={titles.t} subtitle={titles.s} scroll>
      {step === 'email' ? (
        <>
          <TextField
            label="Email address"
            icon="email-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="you@example.com"
          />
          <PrimaryButton title="Send code" icon="send" onPress={sendOtp} loading={loading} style={styles.btn} />
        </>
      ) : null}

      {step === 'otp' ? (
        <>
          <OtpInput value={otp} onChange={setOtp} editable={!loading} />
          <PrimaryButton title="Verify code" onPress={verifyOtp} loading={loading} />
          <TextButton title="Resend code" onPress={sendOtp} tone="muted" style={styles.link} />
        </>
      ) : null}

      {step === 'password' ? (
        <>
          <TextField label="New password" icon="lock-outline" password value={password} onChangeText={setPassword} placeholder="At least 6 characters" />
          <TextField label="Confirm password" icon="lock-check-outline" password value={confirm} onChangeText={setConfirm} placeholder="Type it again" />
          <PrimaryButton title="Update password" icon="check" onPress={savePassword} loading={loading} style={styles.btn} />
        </>
      ) : null}

      <AppText variant="small" tone="muted" center style={styles.note}>
        Step {step === 'email' ? 1 : step === 'otp' ? 2 : 3} of 3
      </AppText>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  btn: { marginTop: 6 },
  link: { marginTop: 6 },
  note: { marginTop: 14 },
});
