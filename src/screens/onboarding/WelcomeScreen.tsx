import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../../styles/theme';
import Button from '../../components/common/Button';
import SafeAreaView from '../../components/common/SafeAreaView';

export default function WelcomeScreen({ navigation }: any) {
  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>⚡</Text>
          <Text style={styles.title}>Welcome to SmartHeal</Text>
          <Text style={styles.subtitle}>
            Your intelligent therapy companion. Let's personalize your experience in just a few steps.
          </Text>
        </View>

        <View style={styles.features}>
          {[
            { icon: '🎯', text: 'AI-guided electrode placement' },
            { icon: '📱', text: 'Smart device pairing' },
            { icon: '📊', text: 'Personalized progress tracking' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <Button title="Get Started" onPress={() => navigation.navigate('ProfileTypeSelection')} size="lg" style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: theme.spacing.lg, justifyContent: 'space-between', paddingBottom: theme.spacing.xl },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 72, marginBottom: theme.spacing.lg },
  title: { ...theme.typography.h1, color: theme.colors.primary, textAlign: 'center', marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body, color: theme.colors.text.secondary, textAlign: 'center', maxWidth: 300 },
  features: { marginBottom: theme.spacing.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  featureIcon: { fontSize: 24, marginRight: theme.spacing.md },
  featureText: { ...theme.typography.body, color: theme.colors.text.primary },
  button: { width: '100%' },
});
