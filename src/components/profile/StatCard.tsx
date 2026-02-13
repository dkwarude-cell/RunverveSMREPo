import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface Props {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

const StatCard: React.FC<Props> = ({ label, value, icon, color = theme.colors.primary }) => (
  <View style={styles.card}>
    {icon && <Text style={styles.icon}>{icon}</Text>}
    <Text style={[styles.value, { color }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, alignItems: 'center', ...theme.shadows.sm },
  icon: { fontSize: 22, marginBottom: 4 },
  value: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 4 },
});

export default React.memo(StatCard);
