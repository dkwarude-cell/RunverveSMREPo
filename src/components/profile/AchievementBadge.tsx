import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { Achievement } from '../../models/Achievement';

interface Props {
  achievement: Achievement;
  size?: 'sm' | 'md';
}

const AchievementBadge: React.FC<Props> = ({ achievement, size = 'md' }) => {
  const isSm = size === 'sm';
  return (
    <View style={[styles.badge, isSm && styles.badgeSm, !!achievement.unlockedAt && styles.unlocked]}>
      <Text style={[styles.icon, isSm && styles.iconSm]}>{achievement.icon}</Text>
      <Text style={[styles.name, isSm && styles.nameSm]} numberOfLines={1}>{achievement.name ?? achievement.title}</Text>
      {!achievement.unlockedAt && (
        <View style={styles.lockOverlay}><Text style={styles.lock}>🔒</Text></View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { width: 90, height: 100, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, alignItems: 'center', justifyContent: 'center', padding: 8, ...theme.shadows.sm },
  badgeSm: { width: 64, height: 72, padding: 4 },
  unlocked: { borderWidth: 2, borderColor: '#FFB800' },
  icon: { fontSize: 28 },
  iconSm: { fontSize: 20 },
  name: { fontSize: 11, fontWeight: '600', color: theme.colors.text.primary, textAlign: 'center', marginTop: 4 },
  nameSm: { fontSize: 9 },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  lock: { fontSize: 18 },
});

export default React.memo(AchievementBadge);
