import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';
import { Session, SessionFilters } from '../../models/Session';
import { getRecentSessions, getFilteredSessions, getStatistics } from '../../services/session/sessionHistory';
import SessionCard from '../../components/session/SessionCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDuration } from '../../utils/formatters';

interface Props { navigation: any }

const SessionHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ totalSessions: number; totalDuration: number; averageIntensity: number; currentStreak: number } | null>(null);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let filters: SessionFilters = {};
      if (filter === 'week') {
        const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filters = { startDate: week, endDate: now };
      } else if (filter === 'month') {
        const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filters = { startDate: month, endDate: now };
      }
      const [s, st] = await Promise.all([
        filter === 'all' ? getRecentSessions(50) : getFilteredSessions(filters),
        getStatistics(),
      ]);
      setSessions(s);
      setStats(st as any);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingSpinner fullScreen message="Loading history..." />;

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      {stats && (
        <View style={styles.statsRow}>
          <StatPill label="Sessions" value={String(stats.totalSessions)} />
          <StatPill label="Total Time" value={formatDuration(stats.totalDuration)} />
          <StatPill label="Streak" value={`${stats.currentStreak}d`} />
        </View>
      )}

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['all', 'week', 'month'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.chip, filter === f && styles.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f === 'all' ? 'All' : f === 'week' ? '7 Days' : '30 Days'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <SessionCard session={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No sessions yet. Start your first session!</Text>}
      />
    </View>
  );
};

const StatPill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statPill}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: theme.spacing.md },
  statPill: { alignItems: 'center', backgroundColor: theme.colors.surface, paddingVertical: 10, paddingHorizontal: 16, borderRadius: theme.borderRadius.lg, ...theme.shadows.sm },
  statValue: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },
  statLabel: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: theme.colors.surface },
  chipActive: { backgroundColor: theme.colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary },
  chipTextActive: { color: '#fff' },
  list: { paddingBottom: 40 },
  empty: { textAlign: 'center', color: theme.colors.text.secondary, marginTop: 40 },
});

export default SessionHistoryScreen;
