/**
 * MedicalHistoryScreen - onboarding step 2: existing conditions with severity and type.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Screen from '../../components/layout/Screen';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import Sheet from '../../components/ui/Sheet';
import StepHeader from '../../components/ui/StepHeader';
import { Chip, Pill, SegmentedTabs } from '../../components/ui/Bits';
import { PrimaryButton, SecondaryButton, TextButton } from '../../components/ui/Buttons';
import { CONDITIONS, CONDITION_SUBTYPES } from '../../data/profileOptions';
import type { Severity } from '../../services/authService';
import { fonts, useTheme, useStyles } from '../../theme';
import type { Palette } from '../../theme';
import { ScreenProps } from '../../navigation/types';

const SEVERITY_COLOR: Record<Severity, string> = { Low: '#8A8A8A', Medium: '#D97706', High: '#E11D2E' };

export default function MedicalHistoryScreen({ navigation, route }: ScreenProps<'MedicalHistory'>) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [selected, setSelected] = useState<string[]>(route.params.conditions ?? []);
  const [none, setNone] = useState((route.params.conditions ?? []).includes('None'));
  const [severity, setSeverity] = useState<Record<string, Severity>>(route.params.severity ?? {});
  const [subtypes, setSubtypes] = useState<Record<string, string | undefined>>(route.params.subtypes ?? {});

  // sheet state
  const [editing, setEditing] = useState<string | null>(null);
  const [tempSeverity, setTempSeverity] = useState<Severity>('Medium');
  const [tempSubtype, setTempSubtype] = useState<string | undefined>();

  const open = (condition: string) => {
    setTempSeverity(severity[condition] ?? 'Medium');
    setTempSubtype(subtypes[condition]);
    setEditing(condition);
  };

  const save = () => {
    if (!editing) return;
    setNone(false);
    setSelected(s => (s.includes(editing) ? s : [...s, editing]));
    setSeverity(s => ({ ...s, [editing]: tempSeverity }));
    setSubtypes(s => ({ ...s, [editing]: tempSubtype }));
    setEditing(null);
  };

  const remove = () => {
    if (!editing) return;
    const c = editing;
    setSelected(s => s.filter(x => x !== c));
    setSeverity(s => {
      const n = { ...s };
      delete n[c];
      return n;
    });
    setSubtypes(s => {
      const n = { ...s };
      delete n[c];
      return n;
    });
    setEditing(null);
  };

  const chooseNone = () => {
    setNone(n => !n);
    setSelected([]);
    setSeverity({});
    setSubtypes({});
  };

  const next = () =>
    navigation.navigate('Goals', {
      ...route.params,
      conditions: none ? ['None'] : selected,
      severity,
      subtypes,
    });

  return (
    <Screen
      header={<StepHeader step={2} onBack={() => navigation.goBack()} />}
      footer={
        <>
          <PrimaryButton title="Continue" iconRight="arrow-right" onPress={next} />
          <TextButton title="Skip for now" tone="muted" onPress={next} />
        </>
      }
    >
      <View>
        <AppText variant="h1" style={styles.title}>
          Your health <AppText variant="h1" tone="red">history</AppText>
        </AppText>
        <AppText variant="body" tone="secondary">
          Tap any condition you have. We use this to keep heat and TENS settings <AppText variant="bodyStrong">safe</AppText> for you.
        </AppText>
      </View>

      <View style={styles.list}>
        {CONDITIONS.map(c => {
          const on = selected.includes(c.label);
          const sev = severity[c.label];
          return (
            <Card key={c.label} onPress={() => open(c.label)} tint={on ? colors.primarySoft : undefined} style={[styles.item, on && styles.itemOn]} padding={14}>
              <View style={styles.itemRow}>
                <View style={[styles.itemIcon, on && styles.itemIconOn]}>
                  <Icon name={c.icon} size={20} color={on ? '#FFF' : colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText style={styles.itemTitle}>{c.label}</AppText>
                  {on ? (
                    <View style={styles.tags}>
                      {sev ? <Pill text={sev} color={SEVERITY_COLOR[sev]} /> : null}
                      {subtypes[c.label] ? (
                        <AppText variant="small" tone="secondary" style={styles.subtype}>
                          {subtypes[c.label]}
                        </AppText>
                      ) : null}
                    </View>
                  ) : (
                    <AppText variant="small" tone="muted">
                      Tap to add
                    </AppText>
                  )}
                </View>
                <Icon name={on ? 'pencil-outline' : 'plus'} size={20} color={on ? colors.textSecondary : colors.textMuted} />
              </View>
            </Card>
          );
        })}

        <Card onPress={chooseNone} tint={none ? colors.primarySoft : undefined} style={[styles.item, none && styles.itemOn]} padding={14}>
          <View style={styles.itemRow}>
            <View style={[styles.itemIcon, none && styles.itemIconOn]}>
              <Icon name="check-decagram-outline" size={20} color={none ? '#FFF' : colors.primary} />
            </View>
            <AppText style={[styles.itemTitle, styles.flex]}>None of these</AppText>
            <Icon name={none ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={22} color={none ? colors.primary : colors.textMuted} />
          </View>
        </Card>
      </View>

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing ?? ''} subtitle="How severe is it?" scroll>
        <SegmentedTabs<Severity> options={['Low', 'Medium', 'High']} value={tempSeverity} onChange={setTempSeverity} />
        {editing && CONDITION_SUBTYPES[editing] ? (
          <>
            <AppText variant="caption" tone="muted" style={styles.sheetLabel}>
              Type (optional)
            </AppText>
            <View style={styles.chips}>
              {CONDITION_SUBTYPES[editing].map(t => (
                <Chip key={t} label={t} selected={tempSubtype === t} onPress={() => setTempSubtype(x => (x === t ? undefined : t))} />
              ))}
            </View>
          </>
        ) : null}
        <View style={styles.sheetActions}>
          {editing && selected.includes(editing) ? (
            <SecondaryButton title="Remove" icon="trash-can-outline" onPress={remove} style={styles.flex} compact />
          ) : null}
          <PrimaryButton title="Save" icon="check" onPress={save} style={styles.flex} compact />
        </View>
      </Sheet>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  title: { marginTop: 12, marginBottom: 6 },
  list: { marginTop: 22 },
  flex: { flex: 1 },
  item: { marginBottom: 10 },
  itemOn: {},
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemIconOn: { backgroundColor: colors.primary },
  itemTitle: { fontFamily: fonts.medium, fontWeight: '700', fontSize: 15 },
  tags: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  subtype: { marginLeft: 8, fontStyle: 'italic' },
  sheetLabel: { marginTop: 20, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
