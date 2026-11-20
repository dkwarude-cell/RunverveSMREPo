/**
 * StepHeader - onboarding progress: "Step 2 of 3" with a simple progress bar.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from './AppText';
import { IconButton } from './Buttons';
import { useTheme } from '../../theme';

const LABELS = ['Basics', 'Health', 'Goals'];

export default function StepHeader({ step, onBack }: { step: 1 | 2 | 3; onBack?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        {onBack ? <IconButton icon="arrow-left" onPress={onBack} size={40} /> : <View style={styles.spacer} />}
        <AppText variant="caption" tone="secondary">
          Step {step} of 3
        </AppText>
        <View style={styles.spacer} />
      </View>
      <View style={styles.bars}>
        {LABELS.map((l, i) => (
          <View key={l} style={styles.barCol}>
            <View style={[styles.bar, { backgroundColor: i < step ? c.primary : c.surfaceStrong }]} />
            <AppText variant="small" tone={i + 1 === step ? 'primary' : 'muted'} style={i + 1 === step ? styles.active : undefined}>
              {l}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 6 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  spacer: { width: 40 },
  bars: { flexDirection: 'row', gap: 6 },
  barCol: { flex: 1 },
  bar: { height: 4, borderRadius: 2, marginBottom: 6 },
  active: { fontWeight: '700' },
});
