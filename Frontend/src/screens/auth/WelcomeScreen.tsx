/**
 * WelcomeScreen - logo (top left), welcome title + four feature cards, and two buttons: Create account / Log in.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AppText from '../../components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Buttons';
import Logo from '../../components/ui/Logo';
import { radius, useTheme } from '../../theme';
import { ScreenProps } from '../../navigation/types';

// each colour gets a 12% tint behind its icon (works on both the white and the black theme)
const FEATURES = [
  { title: 'AI Guidance', icon: 'lightning-bolt-outline', color: '#EF4444' },
  { title: 'Safe Therapy', icon: 'shield-outline', color: '#3B82F6' },
  { title: 'Health Tracking', icon: 'heart-outline', color: '#22C55E' },
  { title: 'Voice Control', icon: 'cellphone', color: '#A855F7' },
];

export default function WelcomeScreen({ navigation }: ScreenProps<'Welcome'>) {
  const insets = useSafeAreaInsets();
  const { c } = useTheme();
  // light theme: white cards lifted with a soft shadow (as in the design); dark theme: flat surface cards
  const cardStyle = c.dark ? { backgroundColor: c.surface } : [styles.cardShadow, { backgroundColor: c.background }];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={[styles.logo, { paddingTop: insets.top + 16 }]}>
        <Logo size={36} />
      </View>

      <ScrollView contentContainerStyle={styles.middle} showsVerticalScrollIndicator={false}>
        <AppText variant="h1" center>
          Welcome to SmartHeal
        </AppText>
        <AppText variant="body" tone="secondary" center style={styles.subtitle}>
          Professional ITT therapy device with AI-powered guidance and personalized treatment plans.
        </AppText>

        <View style={styles.grid}>
          {FEATURES.map(f => (
            <View key={f.title} style={[styles.card, cardStyle]}>
              <View style={[styles.iconCircle, { backgroundColor: f.color + '1F' }]}>
                <Icon name={f.icon} size={24} color={f.color} />
              </View>
              <AppText variant="bodyStrong" center>
                {f.title}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.buttons, { paddingBottom: insets.bottom + 24 }]}>
        <PrimaryButton title="Create Account" onPress={() => navigation.navigate('SignUp')} />
        <SecondaryButton title="Login to Your Account" onPress={() => navigation.navigate('Login')} style={[styles.second, { borderColor: c.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  logo: { paddingHorizontal: 22 },
  middle: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 24 },
  subtitle: { marginTop: 10, marginHorizontal: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 32, rowGap: 14 },
  card: { width: '48%', alignItems: 'center', paddingVertical: 22, paddingHorizontal: 10, borderRadius: radius.lg },
  cardShadow: { elevation: 3, shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  iconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  buttons: { paddingHorizontal: 22 },
  second: { marginTop: 10, borderWidth: 1.5, borderRadius: radius.md, overflow: 'hidden' }, // red outline, like "Continue with Google"
});
