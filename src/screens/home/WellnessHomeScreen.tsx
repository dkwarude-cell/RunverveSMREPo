import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

export default function WellnessHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wellness Dashboard</Text>
      <Text style={styles.subtitle}>Pain management, stress relief, and holistic health</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.md },
  title: { ...theme.typography.h3, color: theme.colors.text.primary },
  subtitle: { ...theme.typography.caption, color: theme.colors.text.secondary, marginTop: 4 },
});
