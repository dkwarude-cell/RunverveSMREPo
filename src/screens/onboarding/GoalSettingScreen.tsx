import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import SafeAreaView from '../../components/common/SafeAreaView';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../store/slices/userSlice';
import { RootState } from '../../store';
import { logEvent } from '../../services/analytics/analyticsService';

export default function GoalSettingScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const [goalType, setGoalType] = useState<string>('pain_reduction');
  const [currentPain, setCurrentPain] = useState('5');
  const [targetPain, setTargetPain] = useState('2');
  const [sessionsPerWeek, setSessionsPerWeek] = useState('3');

  const handleComplete = () => {
    dispatch(updateProfile({ onboardingComplete: true }));
    logEvent('onboarding_completed');
    navigation.navigate('OnboardingComplete');
  };

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Set Your Goals</Text>
        <Text style={styles.subtitle}>Define what you want to achieve with SmartHeal</Text>

        <Text style={styles.sectionLabel}>Goal Type</Text>
        <View style={styles.optionsRow}>
          {[
            { id: 'pain_reduction', label: 'Pain Reduction' },
            { id: 'recovery', label: 'Recovery' },
            { id: 'performance', label: 'Performance' },
          ].map((g) => (
            <Button
              key={g.id}
              title={g.label}
              variant={goalType === g.id ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setGoalType(g.id)}
              style={styles.optionButton}
            />
          ))}
        </View>

        <Input
          label="Current Pain Level (0-10)"
          value={currentPain}
          onChangeText={setCurrentPain}
          keyboardType="numeric"
          placeholder="5"
        />
        <Input
          label="Target Pain Level (0-10)"
          value={targetPain}
          onChangeText={setTargetPain}
          keyboardType="numeric"
          placeholder="2"
        />
        <Input
          label="Sessions Per Week"
          value={sessionsPerWeek}
          onChangeText={setSessionsPerWeek}
          keyboardType="numeric"
          placeholder="3"
        />

        <View style={styles.actions}>
          <Button title="Back" onPress={() => navigation.goBack()} variant="outline" size="lg" style={styles.halfButton} />
          <Button title="Complete" onPress={handleComplete} size="lg" style={styles.halfButton} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl },
  title: { ...theme.typography.h2, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  subtitle: { ...theme.typography.body, color: theme.colors.text.secondary, marginBottom: theme.spacing.xl },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
  optionsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  optionButton: { flex: 1 },
  actions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.xl },
  halfButton: { flex: 1 },
});
