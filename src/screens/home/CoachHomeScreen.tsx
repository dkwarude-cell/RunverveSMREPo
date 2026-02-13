import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

export default function CoachHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coach Dashboard</Text>
      <Text style={styles.subtitle}>Client management, protocols, and progress tracking</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.md },
  title: { ...theme.typography.h3, color: theme.colors.text.primary },
  subtitle: { ...theme.typography.caption, color: theme.colors.text.secondary, marginTop: 4 },
});
