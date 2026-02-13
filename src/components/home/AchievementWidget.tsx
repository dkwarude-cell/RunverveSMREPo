import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import Card from '../common/Card';
import { Achievement } from '../../models/Achievement';

interface Props {
  achievements: Achievement[];
}

const AchievementWidget: React.FC<Props> = ({ achievements }) => {
  const recent = achievements.filter((a) => a.unlockedAt).slice(0, 3);

  return (
    <Card style={styles.container}>
      <Text style={styles.heading}>Achievements</Text>
      {recent.length === 0 ? (
        <Text style={styles.empty}>Complete sessions to unlock achievements!</Text>
      ) : (
        <View style={styles.badgeRow}>
          {recent.map((a) => (
            <View key={a.id} style={styles.badge}>
              <Text style={styles.badgeIcon}>{a.icon}</Text>
              <Text style={styles.badgeTitle}>{a.title}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.lg },
  heading: { ...theme.typography.h3, color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
  empty: { color: theme.colors.text.secondary, fontSize: 14 },
  badgeRow: { flexDirection: 'row', gap: theme.spacing.md },
  badge: { alignItems: 'center' },
  badgeIcon: { fontSize: 32 },
  badgeTitle: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },
});

export default React.memo(AchievementWidget);
