import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';
import Button from '../../components/common/Button';
import SafeAreaView from '../../components/common/SafeAreaView';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateProfile } from '../../store/slices/userSlice';
import { RUNNER_INTERESTS, COACH_INTERESTS, WELLNESS_INTERESTS } from '../../utils/constants';

export default function InterestsSelectionScreen({ navigation }: any) {
  const profileType = useSelector((s: RootState) => s.user.profile?.profileType ?? 'wellness');
  const dispatch = useDispatch();
  const [selected, setSelected] = useState<string[]>([]);

  const interests =
    profileType === 'runner' ? RUNNER_INTERESTS : profileType === 'coach' ? COACH_INTERESTS : WELLNESS_INTERESTS;

  const toggle = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  };

  const handleNext = () => {
    dispatch(updateProfile({ interests: selected }));
    navigation.navigate('GoalSetting');
  };

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Your Interests</Text>
        <Text style={styles.subtitle}>Select the areas that interest you most</Text>

        <View style={styles.grid}>
          {interests.map((interest) => {
            const isSelected = selected.includes(interest);
            return (
              <TouchableOpacity
                key={interest}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggle(interest)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{interest}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button title="Back" onPress={() => navigation.goBack()} variant="outline" size="lg" style={styles.halfButton} />
          <Button title="Next" onPress={handleNext} disabled={selected.length === 0} size="lg" style={styles.halfButton} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl },
  title: { ...theme.typography.h2, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.body, color: theme.colors.text.secondary, marginBottom: theme.spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: theme.colors.surface,
  },
  chipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.text.primary, fontSize: 14 },
  chipTextSelected: { color: '#fff' },
  actions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.xxl },
  halfButton: { flex: 1 },
});
