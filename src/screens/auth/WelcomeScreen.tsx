import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { Zap, Shield, Heart, Smartphone, Check } from 'lucide-react-native';
import { theme } from '../../styles/theme';

type WelcomeScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Welcome'
>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  backgroundColor: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, backgroundColor }) => (
  <View style={[styles.featureCard, { backgroundColor }]}>
    <View style={styles.iconContainer}>{icon}</View>
    <Text style={styles.featureTitle}>{title}</Text>
  </View>
);

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Heart size={20} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>SmartHeal</Text>
          </View>
          <Text style={styles.brandText}>by Runverve</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.appIcon}>
            <Heart size={60} color="#FFFFFF" fill="#FFFFFF" />
          </View>

          <Text style={styles.welcomeTitle}>Welcome to SmartHeal</Text>

          <Text style={styles.subtitle}>
            Professional ITT therapy device with AI-powered guidance and personalized
            treatment plans
          </Text>
        </View>

        {/* Feature Cards Grid */}
        <View style={styles.featuresGrid}>
          <View style={styles.featuresRow}>
            <FeatureCard
              icon={<Zap size={28} color="#FF6B35" strokeWidth={2.5} />}
              title="AI Guidance"
              backgroundColor="#FFE8E0"
            />
            <FeatureCard
              icon={<Shield size={28} color="#004E89" strokeWidth={2.5} />}
              title="Safe Therapy"
              backgroundColor="#E0F2FF"
            />
          </View>

          <View style={styles.featuresRow}>
            <FeatureCard
              icon={<Heart size={28} color="#1A936F" strokeWidth={2.5} />}
              title="Health Tracking"
              backgroundColor="#D4F4E7"
            />
            <FeatureCard
              icon={<Smartphone size={28} color="#9D4EDD" strokeWidth={2.5} />}
              title="Voice Control"
              backgroundColor="#F3E8FF"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            activeOpacity={0.8}
            accessibilityLabel="Login to your account"
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Login to Your Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignup}
            activeOpacity={0.8}
            accessibilityLabel="Create new account"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Create New Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Check size={16} color={theme.colors.text.secondary} strokeWidth={2.5} />
            <Text style={styles.footerText}>FDA Approved</Text>
          </View>
          <View style={styles.footerItem}>
            <Check size={16} color={theme.colors.text.secondary} strokeWidth={2.5} />
            <Text style={styles.footerText}>Clinically Tested</Text>
          </View>
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

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  brandText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },

  // Hero Section Styles
  heroSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  appIcon: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.md,
  },

  // Feature Cards Styles
  featuresGrid: {
    marginBottom: theme.spacing.xl,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  featureCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: theme.spacing.sm,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  // Buttons Styles
  buttonsContainer: {
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer Styles
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
});

export default WelcomeScreen;
