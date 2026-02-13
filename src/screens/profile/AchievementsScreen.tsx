import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { theme } from '../../styles/theme';
import { Achievement, ACHIEVEMENT_DEFINITIONS } from '../../models/Achievement';
import { getUserAchievements } from '../../services/gamification/achievementService';
import AchievementBadge from '../../components/profile/AchievementBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AchievementsScreen: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getUserAchievements('current');
        // Merge with definitions to include locked ones
        const merged: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => {
          const found = data.find(a => a.id === def.id);
          return found || def;
        });
        setAchievements(merged);
      } catch { setAchievements(ACHIEVEMENT_DEFINITIONS); }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner fullScreen message="Loading achievements..." />;

  const unlocked = achievements.filter(a => a.unlockedAt);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Achievements</Text>
      <Text style={styles.subtitle}>{unlocked.length} / {achievements.length} unlocked</Text>

      <FlatList
        data={achievements}
        keyExtractor={a => a.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <AchievementBadge achievement={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary },
  subtitle: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 4, marginBottom: theme.spacing.lg },
  row: { justifyContent: 'space-between', marginBottom: theme.spacing.md },
  list: { paddingBottom: 40 },
});

export default AchievementsScreen;
