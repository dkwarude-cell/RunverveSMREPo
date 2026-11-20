/**
 * AboutScreen - what SmartHeal is, the tech behind it, and the medical disclaimer.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Screen from '../../components/layout/Screen';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import Logo from '../../components/ui/Logo';
import { ScreenHeader, SectionHeader } from '../../components/ui/Bits';
import { fonts, useTheme, useStyles } from '../../theme';
import type { Palette } from '../../theme';
import { ScreenProps } from '../../navigation/types';

const STACK = [
  { part: 'Mobile app', tech: 'React Native · TypeScript' },
  { part: 'Accounts & data', tech: 'Firebase Auth · Firestore' },
  { part: 'Backend API', tech: 'Node.js · Express' },
  { part: 'Image models', tech: 'ResNet50 (body part + wound)' },
  { part: 'Therapy model', tech: 'Random Forest (scikit-learn)' },
  { part: 'AI agent', tech: 'Google ADK · Gemini on Cloud Run' },
  { part: 'Device link', tech: 'Bluetooth Low Energy' },
];

export default function AboutScreen({ navigation }: ScreenProps<'About'>) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <Screen header={<ScreenHeader title="About" onBack={() => navigation.goBack()} />}>
      <View style={styles.hero}>
        <Logo size={64} />
        <AppText variant="h1" style={styles.heroName}>
          SmartHeal
        </AppText>
        <AppText variant="body" tone="secondary" center style={styles.heroText}>
          AI-guided recovery with heat, vibration and TENS therapy.
        </AppText>
      </View>

      <SectionHeader title="Our mission" />
      <Card>
        <AppText variant="body" tone="secondary">
          SmartHeal helps people recover from muscle and joint pain at home. One photo and a few questions give you a{' '}
          <AppText variant="bodyStrong">personal therapy plan</AppText>, checked by AI for safety and tuned to your body.
        </AppText>
      </Card>

      <SectionHeader title="Built with" />
      <Card padding={0}>
        {STACK.map((s, i) => (
          <View key={s.part} style={[styles.tr, i % 2 === 1 && styles.trAlt]}>
            <AppText style={styles.td1}>{s.part}</AppText>
            <AppText style={styles.td2}>{s.tech}</AppText>
          </View>
        ))}
      </Card>

      <SectionHeader title="Team" />
      <Card>
        <View style={styles.teamRow}>
          <Icon name="school-outline" size={22} color={colors.primary} />
          <AppText variant="body" tone="secondary" style={styles.teamText}>
            Final-year project, Computer Engineering,{' '}
            <AppText variant="bodyStrong">K. K. Wagh Institute of Engineering Education and Research</AppText>, Nashik - sponsored by{' '}
            <AppText variant="bodyStrong" tone="red">Runverve</AppText>.
          </AppText>
        </View>
      </Card>

      <Card style={styles.disclaimer} tint={colors.surface}>
        <View style={styles.teamRow}>
          <Icon name="alert-circle-outline" size={22} color={colors.warning} />
          <AppText variant="small" tone="secondary" style={[styles.teamText, styles.italic]}>
            SmartHeal provides AI-based guidance for information only. It is not a medical device diagnosis and does not replace a doctor or
            physiotherapist.
          </AppText>
        </View>
      </Card>

      <AppText variant="small" tone="muted" center style={styles.version}>
        Version 1.0.0
      </AppText>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 12, marginBottom: 4 },
  heroName: { marginTop: 16 },
  heroText: { marginTop: 6, paddingHorizontal: 20 },
  tr: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  trAlt: { backgroundColor: colors.background },
  td1: { width: 130, color: colors.textMuted, fontSize: 13.5, fontFamily: fonts.medium },
  td2: { flex: 1, color: colors.text, fontSize: 13.5, fontWeight: '600' },
  teamRow: { flexDirection: 'row', alignItems: 'flex-start' },
  teamText: { flex: 1, marginLeft: 12 },
  italic: { fontStyle: 'italic' },
  disclaimer: { marginTop: 14 },
  version: { marginTop: 20 },
});