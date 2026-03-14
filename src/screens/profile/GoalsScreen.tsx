import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { theme } from '../../styles/theme';
import { Goal } from '../../models/Goal';
import { getGoals, createGoal, deleteGoal } from '../../services/gamification/goalService';
import ProgressBar from '../../components/profile/ProgressBar';
import Button from '../../components/common/Button';

const GoalsScreen: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    (async () => {
      const g = await getGoals();
      setGoals(g);
    })();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Remove Goal', 'Delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteGoal(id); setGoals(g => g.filter(x => x.id !== id)); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Goals</Text>

      <FlatList
        data={goals}
        keyExtractor={g => g.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.goalType}>{item.goalType.replace(/_/g, ' ')}</Text>
              <Text style={[styles.status, item.status === 'completed' && styles.completedStatus]}>{item.status}</Text>
            </View>
            <ProgressBar progress={item.progress / 100} label={`${item.progress}%`} />
            <Text style={styles.deadline}>Due: {new Date(item.targetDate).toLocaleDateString()}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No goals set. Create one to stay motivated!</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.lg },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.sm, ...theme.shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalType: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary, textTransform: 'capitalize' },
  status: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary },
  completedStatus: { color: theme.colors.success },
  deadline: { fontSize: 12, color: theme.colors.text.disabled, marginTop: 8 },
  list: { paddingBottom: 40 },
  empty: { textAlign: 'center', color: theme.colors.text.secondary, marginTop: 40 },
});

export default GoalsScreen;
