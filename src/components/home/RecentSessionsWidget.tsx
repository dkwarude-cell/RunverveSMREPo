import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { theme } from '../../styles/theme';
import Card from '../common/Card';
import { Session } from '../../models/Session';
import { formatBodyArea, formatDate, formatDuration } from '../../utils/formatters';

interface Props {
  sessions: Session[];
  onViewAll?: () => void;
}

const RecentSessionsWidget: React.FC<Props> = ({ sessions, onViewAll }) => {
  if (sessions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Recent Sessions</Text>
        <Card><Text style={styles.empty}>No sessions yet. Start your first session!</Text></Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Recent Sessions</Text>
        {onViewAll && (
          <Text style={styles.viewAll} onPress={onViewAll}>View All</Text>
        )}
      </View>
      {sessions.slice(0, 3).map((s) => (
        <Card key={s.id} style={styles.sessionCard}>
          <View style={styles.row}>
            <Text style={styles.bodyArea}>{formatBodyArea(s.bodyArea)}</Text>
            <Text style={styles.date}>{formatDate(s.startTime)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.detail}>{formatDuration(s.duration)}</Text>
            <Text style={styles.detail}>Intensity {s.intensity}</Text>
            {s.rating && <Text style={styles.detail}>{'⭐'.repeat(s.rating)}</Text>}
          </View>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  heading: { ...theme.typography.h3, color: theme.colors.text.primary },
  viewAll: { color: theme.colors.primary, fontWeight: '600', fontSize: 14 },
  sessionCard: { marginBottom: theme.spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bodyArea: { fontWeight: '600', color: theme.colors.text.primary },
  date: { color: theme.colors.text.secondary, fontSize: 12 },
  detail: { color: theme.colors.text.secondary, fontSize: 13 },
  empty: { color: theme.colors.text.secondary, textAlign: 'center', paddingVertical: theme.spacing.md },
});

export default React.memo(RecentSessionsWidget);
