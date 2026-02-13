import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import Button from '../../components/common/Button';
import SafeAreaView from '../../components/common/SafeAreaView';

export default function OnboardingCompleteScreen({ navigation }: any) {
  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text style={styles.icon}>🎉</Text>
        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.subtitle}>
          Your SmartHeal experience has been personalized. Let's start your healing journey.
        </Text>
        <Button
          title="Go to Dashboard"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
          size="lg"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.lg },
  icon: { fontSize: 80, marginBottom: theme.spacing.lg },
  title: { ...theme.typography.h1, color: theme.colors.primary, marginBottom: theme.spacing.sm },
  subtitle: { ...theme.typography.body, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: theme.spacing.xxl, maxWidth: 280 },
  button: { width: '100%' },
});
