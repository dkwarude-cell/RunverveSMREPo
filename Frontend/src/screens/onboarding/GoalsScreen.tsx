/**
 * GoalsScreen - onboarding step 3: goals + BMI insight, then saves the whole profile to the backend.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Screen from '../../components/layout/Screen';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import StepHeader from '../../components/ui/StepHeader';
import Touchable from '../../components/ui/Touchable';
import { PrimaryButton, TextButton } from '../../components/ui/Buttons';
import { useAppModal } from '../../components/feedback/AppModalProvider';
import { useUser } from '../../context/UserContext';
import { GOALS, bmiInfo } from '../../data/profileOptions';
import { apiErrorMessage } from '../../services/apiClient';
import { fonts, radius, useTheme, useStyles } from '../../theme';
import type { Palette } from '../../theme';
import { ScreenProps } from '../../navigation/types';

export default function GoalsScreen({ navigation, route }: ScreenProps<'Goals'>) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const modal = useAppModal();
  const { updateProfile } = useUser();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const p = route.params;
  const bmi = useMemo(() => bmiInfo(p.weightKg, p.heightCm), [p.weightKg, p.heightCm]);

  const toggle = (g: string) => setSelected(s => (s.includes(g) ? s.filter(x => x !== g) : [...s, g]));

  const finish = async () => {
    try {
      setSaving(true);
      await updateProfile({
        weightKg: p.weightKg,
        heightCm: p.heightCm,
        age: p.age,
        gender: p.gender,
        activityLevel: p.activityLevel,
        conditions: p.conditions,
        severity: p.severity,
        subtypes: p.subtypes,
        goals: selected,
        onboardingComplete: true,
      });
      navigation.reset({ index: 0, routes: [{ name: 'Celebration' }] });
    } catch (e: any) {
      modal.alert({
        type: 'error',
        title: 'Could not save your profile',
        message: apiErrorMessage(e, 'Please try again.'),
        actions: [
          { label: 'Skip', style: 'secondary', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }) },
          { label: 'Retry', style: 'primary', onPress: finish },
        ],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      header={<StepHeader step={3} onBack={() => navigation.goBack()} />}
      footer={
        <>
          <PrimaryButton title="Complete setup" icon="check-circle-outline" onPress={finish} loading={saving} />
          <TextButton title="Skip for now" tone="muted" onPress={finish} />
        </>
      }
    >
      <View>
        <AppText variant="h1" style={styles.title}>
          What’s your <AppText variant="h1" tone="red">goal?</AppText>
        </AppText>
        <AppText variant="body" tone="secondary">
          Pick everything that matters to you. You can change this later in your profile.
        </AppText>
      </View>

      {bmi ? (
        <View>
          <Card style={styles.bmiCard} tint={colors.primarySoft}>
            <View style={styles.bmiRow}>
              <View>
                <AppText variant="caption" tone="secondary">
                  BMI insight
                </AppText>
                <View style={styles.bmiValueRow}>
                  <AppText variant="number">{bmi.value}</AppText>
                  <AppText variant="small" tone="muted" style={styles.unit}>
                    kg/m²
                  </AppText>
                </View>
              </View>
              <View style={styles.bmiBadge}>
                <AppText style={styles.bmiBadgeText}>{bmi.label}</AppText>
              </View>
            </View>
            <View style={styles.scale}>
              {[18.5, 25, 30, 40].map((edge, i) => (
                <View key={edge} style={[styles.scaleSeg, { opacity: 0.35 + i * 0.2 }]} />
              ))}
              <View style={[styles.marker, { left: `${Math.min(97, Math.max(2, ((bmi.value - 14) / 26) * 100))}%` }]} />
            </View>
            <AppText variant="small" tone="muted" style={styles.bmiHint}>
              Based on the height and weight you entered.
            </AppText>
          </Card>
        </View>
      ) : null}

      <View style={styles.grid}>
        {GOALS.map(g => {
          const on = selected.includes(g.label);
          return (
            <Touchable key={g.label} onPress={() => toggle(g.label)} style={styles.cell}>
              <View style={[styles.goal, on && styles.goalOn]}>
                <View style={[styles.goalIcon, on && styles.goalIconOn]}>
                  <Icon name={g.icon} size={24} color={on ? '#FFF' : colors.primary} />
                </View>
                <AppText style={styles.goalText}>{g.label}</AppText>
                <Icon
                  name={on ? 'check-circle' : 'circle-outline'}
                  size={20}
                  color={on ? colors.primary : colors.textMuted}
                  style={styles.goalCheck}
                />
              </View>
            </Touchable>
          );
        })}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  title: { marginTop: 12, marginBottom: 6 },
  bmiCard: { marginTop: 20 },
  bmiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bmiValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  unit: { marginLeft: 6 },
  bmiBadge: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.primary },
  bmiBadgeText: { fontFamily: fonts.medium, fontWeight: '700', fontSize: 13 },
  scale: { flexDirection: 'row', height: 6, marginTop: 14, borderRadius: 3, overflow: 'visible' },
  scaleSeg: { flex: 1, backgroundColor: colors.primary, marginRight: 3, borderRadius: 3 },
  marker: {
    position: 'absolute',
    top: -5,
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.ink,
  },
  bmiHint: { marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, marginHorizontal: -5 },
  cell: { width: '50%', padding: 5 },
  goal: {
    height: 128,
    borderRadius: radius.lg,
    padding: 14,
    backgroundColor: colors.surface,
    justifyContent: 'space-between',
  },
  goalOn: { backgroundColor: colors.primarySoft },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconOn: { backgroundColor: colors.primary },
  goalText: { fontFamily: fonts.medium, fontWeight: '700', fontSize: 15 },
  goalCheck: { position: 'absolute', top: 14, right: 14 },
});
