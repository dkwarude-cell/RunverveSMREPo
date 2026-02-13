import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';
import { Session } from '../../models/Session';
import { formatBodyArea, formatDate, formatDuration } from '../../utils/formatters';

interface Props {
  session: Session;
  onPress?: () => void;
}

const SessionCard: React.FC<Props> = ({ session, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
      <View style={styles.row}>
        <Text style={styles.bodyArea}>{formatBodyArea(session.bodyArea)}</Text>
        <Text style={styles.mode}>{session.mode.toUpperCase()}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.detail}>{formatDate(session.startTime)}</Text>
        <Text style={styles.detail}>{formatDuration(session.duration)}</Text>
        <Text style={styles.detail}>Lvl {session.intensity}</Text>
      </View>
      {session.rating !== undefined && (
        <Text style={styles.rating}>{'⭐'.repeat(session.rating)}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bodyArea: { fontWeight: '600', fontSize: 16, color: theme.colors.text.primary },
  mode: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  detail: { color: theme.colors.text.secondary, fontSize: 13 },
  rating: { marginTop: 4 },
});

export default React.memo(SessionCard);
