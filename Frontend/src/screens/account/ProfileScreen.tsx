/**
 * ProfileScreen - the user's details from the backend, with an edit sheet.
 */
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppText from '../../components/ui/AppText';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import TextField from '../../components/ui/TextField';
import Sheet from '../../components/ui/Sheet';
import { Chip, ListRow, Pill, ScreenHeader, SectionHeader } from '../../components/ui/Bits';
import { IconButton, PrimaryButton } from '../../components/ui/Buttons';
import { useAppModal } from '../../components/feedback/AppModalProvider';
import { useUser } from '../../context/UserContext';
import { ACTIVITY_LEVELS, GENDERS, GOALS, activityLabel, bmiInfo, genderLabel } from '../../data/profileOptions';
import type { ActivityLevel, Gender } from '../../services/authService';
import { apiErrorMessage } from '../../services/apiClient';
import { digitsOnly } from '../../utils/validation';
import { fonts, useTheme, useStyles } from '../../theme';
import type { Palette } from '../../theme';
import { ScreenProps } from '../../navigation/types';

const SEVERITY_COLOR: Record<string, string> = { Low: '#8A8A8A', Medium: '#D97706', High: '#E11D2E' };

export default function ProfileScreen({ navigation }: ScreenProps<'Profile'>) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const modal = useAppModal();
  const { user, profile, displayName, refreshProfile, updateProfile } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // edit form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<Gender | undefined>();
  const [activity, setActivity] = useState<ActivityLevel | undefined>();
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    if (!editOpen) return;
    setName(profile?.fullName ?? displayName);
    setPhone(profile?.phone ?? '');
    setAge(profile?.age ? String(profile.age) : '');
    setHeight(profile?.heightCm ? String(profile.heightCm) : '');
    setWeight(profile?.weightKg ? String(profile.weightKg) : '');
    setGender(profile?.gender);
    setActivity(profile?.activityLevel);
    setGoals(profile?.goals ?? []);
  }, [editOpen, profile, displayName]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const save = async () => {
    if (!name.trim()) {
      modal.alert({ type: 'warning', title: 'Name required', message: 'Please enter your name.' });
      return;
    }
    try {
      setSaving(true);
      await updateProfile({
        fullName: name.trim(),
        phone: phone.trim() || undefined,
        age: age ? Number(age) : undefined,
        heightCm: height ? parseFloat(height) : undefined,
        weightKg: weight ? parseFloat(weight) : undefined,
        gender,
        activityLevel: activity,
        goals,
      });
      setEditOpen(false);
      modal.toast({ type: 'success', title: 'Profile updated' });
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Could not save', message: apiErrorMessage(e, 'Please try again.') });
    } finally {
      setSaving(false);
    }
  };

  const bmi = bmiInfo(profile?.weightKg, profile?.heightCm);
  const conditions = (profile?.conditions ?? []).filter(c => c !== 'None');

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <ScreenHeader title="Profile" onBack={() => navigation.goBack()} right={<IconButton icon="pencil-outline" size={42} onPress={() => setEditOpen(true)} />} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} progressBackgroundColor="#1C1C1E" />}
      >
        <View style={styles.top}>
          <Avatar name={displayName} size={96} />
          <AppText variant="h1" center style={styles.name}>
            {displayName}
          </AppText>
          <AppText variant="body" tone="secondary" center>
            {user?.email}
          </AppText>
          {profile?.onboardingComplete ? <View style={styles.pillWrap}><Pill text="Profile complete" icon="check-decagram" /></View> : null}
        </View>

        <View>
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <Stat label="Age" value={profile?.age ? `${profile.age}` : '--'} />
              <Stat label="Height" value={profile?.heightCm ? `${profile.heightCm}` : '--'} unit="cm" />
              <Stat label="Weight" value={profile?.weightKg ? `${profile.weightKg}` : '--'} unit="kg" />
              <Stat label="BMI" value={bmi ? `${bmi.value}` : '--'} />
            </View>
            {bmi ? (
              <AppText variant="small" tone="secondary" center style={styles.bmiLine}>
                BMI category: <AppText variant="small" style={styles.bold}>{bmi.label}</AppText>
              </AppText>
            ) : null}
          </Card>
        </View>

        <SectionHeader title="Personal" />
        <Card padding={8}>
          <ListRow icon="account-outline" label="Full name" value={profile?.fullName || displayName} />
          <ListRow icon="email-outline" label="Email" value={user?.email ?? ''} />
          <ListRow icon="phone-outline" label="Phone" value={profile?.phone || 'Not added'} />
          <ListRow icon="gender-male-female" label="Gender" value={genderLabel(profile?.gender) || 'Not added'} />
          <ListRow icon="run" label="Activity" value={activityLabel(profile?.activityLevel) || 'Not added'} last />
        </Card>

        <SectionHeader title="Health history" />
        <Card>
          {conditions.length ? (
            conditions.map((c, i) => (
              <View key={c} style={[styles.condRow, i > 0 && styles.condBorder]}>
                <Icon name="medical-bag" size={18} color={colors.primary} />
                <View style={styles.condText}>
                  <AppText style={styles.bold}>{c}</AppText>
                  {profile?.subtypes?.[c] ? (
                    <AppText variant="small" tone="muted" style={styles.italic}>
                      {profile.subtypes[c]}
                    </AppText>
                  ) : null}
                </View>
                {profile?.severity?.[c] ? <Pill text={profile.severity[c]} color={SEVERITY_COLOR[profile.severity[c]] ?? '#8A8A8A'} /> : null}
              </View>
            ))
          ) : (
            <View style={styles.condRow}>
              <Icon name="check-decagram-outline" size={18} color={colors.primary} />
              <AppText tone="secondary" style={styles.condText}>
                No conditions recorded
              </AppText>
            </View>
          )}
        </Card>

        <SectionHeader title="Goals" action="Edit" onAction={() => setEditOpen(true)} />
        <View style={styles.goals}>
          {profile?.goals?.length ? (
            profile.goals.map(g => <Chip key={g} label={g} selected />)
          ) : (
            <AppText variant="small" tone="muted">
              No goals selected yet.
            </AppText>
          )}
        </View>

        <AppText variant="small" tone="muted" center style={styles.hint}>
          Pull down to refresh
        </AppText>
      </ScrollView>

      <Sheet visible={editOpen} onClose={() => setEditOpen(false)} title="Edit profile" subtitle="Keep your details up to date for better recommendations." scroll>
        <TextField label="Full name" icon="account-outline" value={name} onChangeText={setName} autoCapitalize="words" />
        <TextField label="Phone" icon="phone-outline" value={phone} onChangeText={t => setPhone(digitsOnly(t))} keyboardType="phone-pad" maxLength={10} />
        <View style={styles.row3}>
          <View style={styles.flex}>
            <TextField label="Age" value={age} onChangeText={t => setAge(t.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" />
          </View>
          <View style={styles.gap} />
          <View style={styles.flex}>
            <TextField label="Height cm" value={height} onChangeText={t => setHeight(t.replace(/[^0-9.]/g, '').slice(0, 5))} keyboardType="decimal-pad" />
          </View>
          <View style={styles.gap} />
          <View style={styles.flex}>
            <TextField label="Weight kg" value={weight} onChangeText={t => setWeight(t.replace(/[^0-9.]/g, '').slice(0, 5))} keyboardType="decimal-pad" />
          </View>
        </View>
        <AppText variant="caption" tone="muted" style={styles.sheetLabel}>
          Gender
        </AppText>
        <View style={styles.chips}>
          {GENDERS.map(g => (
            <Chip key={g.value} label={g.label} selected={gender === g.value} onPress={() => setGender(g.value)} />
          ))}
        </View>
        <AppText variant="caption" tone="muted" style={styles.sheetLabel}>
          Activity level
        </AppText>
        <View style={styles.chips}>
          {ACTIVITY_LEVELS.map(a => (
            <Chip key={a.value} label={a.label} icon={a.icon} selected={activity === a.value} onPress={() => setActivity(a.value)} />
          ))}
        </View>
        <AppText variant="caption" tone="muted" style={styles.sheetLabel}>
          Goals
        </AppText>
        <View style={styles.chips}>
          {GOALS.map(g => (
            <Chip
              key={g.label}
              label={g.label}
              icon={g.icon}
              selected={goals.includes(g.label)}
              onPress={() => setGoals(s => (s.includes(g.label) ? s.filter(x => x !== g.label) : [...s, g.label]))}
            />
          ))}
        </View>
        <PrimaryButton title="Save changes" icon="check" onPress={save} loading={saving} style={styles.saveBtn} />
      </Sheet>
    </View>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.stat}>
      <AppText style={styles.statValue}>
        {value}
        {unit && value !== '--' ? <AppText variant="small" tone="muted">{` ${unit}`}</AppText> : null}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 18 },
  content: { paddingHorizontal: 18 },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  top: { alignItems: 'center', marginTop: 8 },
  name: { marginTop: 14 },
  pillWrap: { marginTop: 10 },
  statsCard: { marginTop: 22 },
  statsRow: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: 24, fontWeight: '700' },
  bmiLine: { marginTop: 12 },
  condRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  condBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  condText: { flex: 1, marginLeft: 12 },
  goals: { flexDirection: 'row', flexWrap: 'wrap' },
  hint: { marginTop: 24 },
  row3: { flexDirection: 'row' },
  gap: { width: 10 },
  sheetLabel: { marginTop: 6, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  saveBtn: { marginTop: 14 },
});
