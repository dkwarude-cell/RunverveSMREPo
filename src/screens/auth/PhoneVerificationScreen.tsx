import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/types';
import { ArrowLeft, Heart, MessageSquare, Phone, Mail } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/slices/authSlice';
import {
  verifyCode as verifyOtp,
  sendCode,
  sendCodeViaCall,
  sendCodeViaEmail,
} from '../../services/auth/phoneVerificationService';

type NavProp = StackNavigationProp<AuthStackParamList, 'PhoneVerification'>;
type RoutePropType = RouteProp<AuthStackParamList, 'PhoneVerification'>;

interface Props {
  navigation: NavProp;
  route: RoutePropType;
}

const PhoneVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phoneNumber, userId } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when complete
    if (index === 5 && value) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (code?: string) => {
    const verificationCode = code || otp.join('');
    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(userId, phoneNumber, verificationCode);
      Alert.alert('Success', 'Phone number verified successfully!', [
        {
          text: 'Continue',
          onPress: () => {
            // AppNavigator handles routing based on auth state
            // For dev, login already sets isAuthenticated = true
          },
        },
      ]);
    } catch (error: any) {
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      if (error.code === 'invalid-code') {
        Alert.alert('Invalid Code', 'The code you entered is incorrect. Please try again.');
      } else if (error.code === 'code-expired') {
        Alert.alert('Code Expired', 'This code has expired. Please request a new one.');
        setCanResend(true);
        setTimer(0);
      } else if (error.code === 'too-many-attempts') {
        Alert.alert('Too Many Attempts', 'Please try again later or use another verification method.');
      } else {
        Alert.alert('Error', 'Failed to verify code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setResendLoading(true);
    try {
      await sendCode(phoneNumber);
      setTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
    } catch {
      Alert.alert('Error', 'Failed to send code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCallMe = () => {
    Alert.alert('Call Verification', 'You will receive a phone call with your verification code.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call Me',
        onPress: async () => {
          try {
            await sendCodeViaCall(phoneNumber);
            Alert.alert('Calling...', 'You will receive a call shortly with your code.');
          } catch {
            Alert.alert('Error', 'Failed to initiate call. Please try again.');
          }
        },
      },
    ]);
  };

  const handleEmailCode = () => {
    Alert.alert('Email Verification', 'We will send the verification code to your registered email address.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Email',
        onPress: async () => {
          try {
            await sendCodeViaEmail(userId);
            Alert.alert('Email Sent', 'Verification code sent to your email.');
          } catch {
            Alert.alert('Error', 'Failed to send email. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color={theme.colors.text.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Heart size={16} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>SmartHeal</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <MessageSquare size={40} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.title}>Verify Your Number</Text>
          <Text style={styles.subtitle}>We've sent a 6-digit code to</Text>
          <Text style={styles.phoneNumberText}>{phoneNumber}</Text>
        </View>

        {/* OTP Inputs */}
        <View style={styles.otpSection}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
                accessibilityLabel={`Digit ${index + 1}`}
              />
            ))}
          </View>

          {/* Timer / Resend */}
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResendCode} disabled={resendLoading} activeOpacity={0.7}>
                <Text style={styles.resendText}>{resendLoading ? 'Sending...' : 'Resend code'}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>Resend code in {timer}s</Text>
            )}
          </View>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, loading ? styles.verifyButtonDisabled : null]}
          onPress={() => handleVerifyCode()}
          activeOpacity={0.8}
          disabled={loading || otp.join('').length !== 6}
          accessibilityLabel="Verify code"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        {/* Alternative Options */}
        <View style={styles.alternativeSection}>
          <Text style={styles.alternativeTitle}>Didn't receive the code?</Text>
          <View style={styles.alternativeButtons}>
            <TouchableOpacity
              style={styles.alternativeButton}
              onPress={handleCallMe}
              activeOpacity={0.8}
              disabled={loading}
              accessibilityLabel="Call me"
              accessibilityRole="button"
            >
              <Phone size={18} color={theme.colors.text.primary} />
              <Text style={styles.alternativeButtonText}>Call Me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.alternativeButton}
              onPress={handleEmailCode}
              activeOpacity={0.8}
              disabled={loading}
              accessibilityLabel="Email code"
              accessibilityRole="button"
            >
              <Mail size={18} color={theme.colors.text.primary} />
              <Text style={styles.alternativeButtonText}>Email Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityText}>
            🔒 This verification step ensures the security of your SmartHeal account and medical data
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xs,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  phoneNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // OTP
  otpSection: {
    marginBottom: theme.spacing.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  otpInput: {
    width: 50,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  otpInputFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF5F3',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  timerText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Verify Button
  verifyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Alternative Options
  alternativeSection: {
    marginBottom: theme.spacing.xl,
  },
  alternativeTitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  alternativeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  alternativeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: theme.spacing.xs,
  },
  alternativeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },

  // Security Notice
  securityNotice: {
    backgroundColor: '#EFF6FF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  securityText: {
    fontSize: 13,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PhoneVerificationScreen;
