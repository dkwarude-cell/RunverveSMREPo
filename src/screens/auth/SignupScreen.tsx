import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Heart, User, Phone } from 'lucide-react-native';
import { theme } from '../../styles/theme';
import { signup as authSignup } from '../../services/auth/authService';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { setUser } from '../../store/slices/authSlice';

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });

  // Validation
  const validateFullName = (value: string): boolean => {
    if (!value.trim()) {
      setErrors((p) => ({ ...p, fullName: 'Full name is required' }));
      return false;
    }
    if (value.trim().length < 2) {
      setErrors((p) => ({ ...p, fullName: 'Name must be at least 2 characters' }));
      return false;
    }
    setErrors((p) => ({ ...p, fullName: '' }));
    return true;
  };

  const validateEmail = (value: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setErrors((p) => ({ ...p, email: 'Email is required' }));
      return false;
    }
    if (!re.test(value)) {
      setErrors((p) => ({ ...p, email: 'Please enter a valid email' }));
      return false;
    }
    setErrors((p) => ({ ...p, email: '' }));
    return true;
  };

  const validatePhone = (value: string): boolean => {
    const digits = value.replace(/\D/g, '');
    if (!value) {
      setErrors((p) => ({ ...p, phoneNumber: 'Phone number is required' }));
      return false;
    }
    if (digits.length < 10) {
      setErrors((p) => ({ ...p, phoneNumber: 'Please enter a valid phone number' }));
      return false;
    }
    setErrors((p) => ({ ...p, phoneNumber: '' }));
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setErrors((p) => ({ ...p, password: 'Password is required' }));
      return false;
    }
    if (value.length < 8) {
      setErrors((p) => ({ ...p, password: 'Password must be at least 8 characters' }));
      return false;
    }
    setErrors((p) => ({ ...p, password: '' }));
    return true;
  };

  const validateConfirmPassword = (value: string): boolean => {
    if (!value) {
      setErrors((p) => ({ ...p, confirmPassword: 'Please confirm your password' }));
      return false;
    }
    if (value !== password) {
      setErrors((p) => ({ ...p, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    setErrors((p) => ({ ...p, confirmPassword: '' }));
    return true;
  };

  const validateTerms = (): boolean => {
    if (!termsAccepted) {
      setErrors((p) => ({ ...p, terms: 'You must accept the terms to continue' }));
      return false;
    }
    setErrors((p) => ({ ...p, terms: '' }));
    return true;
  };

  const handleCreateAccount = async () => {
    const v1 = validateFullName(fullName);
    const v2 = validateEmail(email);
    const v3 = validatePhone(phoneNumber);
    const v4 = validatePassword(password);
    const v5 = validateConfirmPassword(confirmPassword);
    const v6 = validateTerms();
    if (!v1 || !v2 || !v3 || !v4 || !v5 || !v6) return;

    setLoading(true);
    try {
      const user = await authSignup(email.trim(), password, fullName.trim());
      dispatch(setUser(user));
      // Navigate to phone verification instead of logging in directly
      navigation.navigate('PhoneVerification', {
        phoneNumber: phoneNumber.trim(),
        userId: user.id,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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

          {/* Hero */}
          <View style={styles.heroSection}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join SmartHeal for personalized therapy</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputContainer, errors.fullName ? styles.inputError : null]}>
                <User size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={fullName}
                  onChangeText={setFullName}
                  onBlur={() => validateFullName(fullName)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                  accessibilityLabel="Full name input"
                />
              </View>
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
                <Mail size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => validateEmail(email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  accessibilityLabel="Email address input"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, errors.phoneNumber ? styles.inputError : null]}>
                <Phone size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onBlur={() => validatePhone(phoneNumber)}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  editable={!loading}
                  accessibilityLabel="Phone number input"
                />
              </View>
              {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                <Lock size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => validatePassword(password)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  accessibilityLabel="Password input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.colors.text.secondary} />
                  ) : (
                    <Eye size={20} color={theme.colors.text.secondary} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : null]}>
                <Lock size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onBlur={() => validateConfirmPassword(confirmPassword)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  accessibilityLabel="Confirm password input"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={theme.colors.text.secondary} />
                  ) : (
                    <Eye size={20} color={theme.colors.text.secondary} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>

            {/* Terms & Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                onPress={() => setTermsAccepted(!termsAccepted)}
                style={styles.checkbox}
                activeOpacity={0.7}
                accessibilityLabel="Accept terms and conditions"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
              >
                <View style={[styles.checkboxBox, termsAccepted ? styles.checkboxChecked : null]}>
                  {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>I agree to the </Text>
                <TouchableOpacity
                  onPress={() => Alert.alert('Terms of Service', 'Terms of Service content would be displayed here.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.termsLink}>Terms of Service</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> and </Text>
                <TouchableOpacity
                  onPress={() => Alert.alert('Privacy Policy', 'Privacy Policy content would be displayed here.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
            {errors.terms ? <Text style={styles.errorText}>{errors.terms}</Text> : null}

            {/* Create Account Button */}
            <TouchableOpacity
              style={[styles.createButton, loading ? styles.createButtonDisabled : null]}
              onPress={handleCreateAccount}
              activeOpacity={0.8}
              disabled={loading}
              accessibilityLabel="Create account"
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
                disabled={loading}
                accessibilityLabel="Sign in"
                accessibilityRole="button"
              >
                <Text style={styles.signInLink}>Sign in here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Form
  formSection: {
    marginTop: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 52,
  },
  inputError: {
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  eyeIcon: {
    padding: theme.spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },

  // Terms
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  checkbox: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  termsLink: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Create Account Button
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.md,
  },

  // Sign In
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  signInText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  signInLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default SignupScreen;
