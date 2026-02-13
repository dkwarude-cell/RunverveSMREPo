import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
}

interface QuickActionsPanelProps {
  actions: readonly QuickAction[];
  onAction: (id: string) => void;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ actions, onAction }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity key={action.id} style={styles.actionCard} onPress={() => onAction(action.id)} activeOpacity={0.8}>
            <Text style={styles.actionIcon}>{action.icon}</Text>
            <Text style={styles.actionTitle}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.lg },
  heading: { ...theme.typography.h3, color: theme.colors.text.primary, marginBottom: theme.spacing.md },
  grid: { flexDirection: 'row', gap: theme.spacing.sm },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  actionIcon: { fontSize: 28, marginBottom: theme.spacing.sm },
  actionTitle: { fontSize: 12, fontWeight: '600', color: theme.colors.text.primary, textAlign: 'center' },
});

export default React.memo(QuickActionsPanel);
