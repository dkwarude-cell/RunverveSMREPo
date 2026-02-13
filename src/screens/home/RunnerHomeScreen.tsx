import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

export default function RunnerHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Runner Dashboard</Text>
      <Text style={styles.subtitle}>Training plans, recovery sessions, and performance analytics</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.md },
  title: { ...theme.typography.h3, color: theme.colors.text.primary },
  subtitle: { ...theme.typography.caption, color: theme.colors.text.secondary, marginTop: 4 },
});
