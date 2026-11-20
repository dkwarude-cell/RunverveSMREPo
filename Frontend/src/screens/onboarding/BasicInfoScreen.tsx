/**
 * BasicInfoScreen - onboarding step 1: age, gender, height, weight, activity level.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';

import Screen from '../../components/layout/Screen';
import AppText from '../../components/ui/AppText';
import Card from '../../components/ui/Card';
import TextField from '../../components/ui/TextField';
import StepHeader from '../../components/ui/StepHeader';
import { Chip } from '../../components/ui/Bits';
import { PrimaryButton, SecondaryButton, TextButton } from '../../components/ui/Buttons';
import { useAppModal } from '../../components/feedback/AppModalProvider';
import { useUser } from '../../context/UserContext';
import { ACTIVITY_LEVELS, GENDERS, bmiInfo } from '../../data/profileOptions';
import type { ActivityLevel, Gender, Severity } from '../../services/authService';
import { extractMedicalReportProfile, MAX_FILE_MB, SUPPORTED_TYPES } from '../../services/chatService';
import type { MedicalReportExtraction } from '../../services/chatService';
import { fonts, useTheme, useStyles } from '../../theme';
import type { Palette } from '../../theme';
import { ScreenProps } from '../../navigation/types';

export default function BasicInfoScreen({ navigation }: ScreenProps<'BasicInfo'>) {
  const { c: colors } = useTheme();
  const styles = useStyles(makeStyles);
  const modal = useAppModal();
  const { firstName, user } = useUser();
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<Gender | undefined>();
  const [activity, setActivity] = useState<ActivityLevel | undefined>();
  const [scanningReport, setScanningReport] = useState(false);
  const [extraction, setExtraction] = useState<MedicalReportExtraction | null>(null);
  const [reportFileName, setReportFileName] = useState('');
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Record<string, Severity>>({});
  const [subtypes, setSubtypes] = useState<Record<string, string | undefined>>({});

  const bmi = useMemo(() => bmiInfo(parseFloat(weight), parseFloat(height)), [weight, height]);
  const valid = Boolean(age && height && weight && gender && activity);

  const scanReport = async () => {
    try {
      const [file] = await pick({ type: [types.pdf, types.images], allowMultiSelection: false });
      if (!file) return;
      const fileName = file.name ?? 'medical-report';
      const extension = fileName.toLowerCase().split('.').pop();
      const extensionTypes: Record<string, string> = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        heic: 'image/heic',
        heif: 'image/heif',
      };
      const fileType = file.type?.toLowerCase();
      const mimeType = (fileType && fileType !== 'application/octet-stream' ? fileType : extensionTypes[extension ?? ''] ?? '').toLowerCase();
      if (!SUPPORTED_TYPES.includes(mimeType)) {
        modal.alert({ type: 'warning', title: 'File type not supported', message: 'Please choose a PDF, JPG, PNG, WEBP, HEIC or HEIF report.' });
        return;
      }
      if (file.size && file.size > MAX_FILE_MB * 1024 * 1024) {
        modal.alert({ type: 'warning', title: 'File too large', message: `Please choose a report under ${MAX_FILE_MB} MB.` });
        return;
      }
      const confirmed = await modal.confirm({
        title: 'Send report for Analysis?',
        message: 'The report will be sent to SmartHeal’s assistant for extraction. Review all suggested details before using them in onboarding.',
        confirmLabel: 'Continue',
        icon: 'file-document-check-outline',
      });
      if (!confirmed) return;
      if (!user?.uid) throw new Error('You must be signed in to scan a report.');

      setScanningReport(true);
      const result = await extractMedicalReportProfile(user.uid, {
        uri: file.uri,
        name: fileName,
        mimeType,
        size: file.size ?? undefined,
      });
      if (!result.age && !result.heightCm && !result.weightKg && !result.gender && !result.conditions.length) {
        throw new Error('No supported profile details were found in this report.');
      }
      setExtraction(result);
      setReportFileName(fileName);
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return;
      modal.alert({
        type: 'error',
        title: 'Could not scan report',
        message: error instanceof Error ? error.message : 'Please try another report.',
      });
    } finally {
      setScanningReport(false);
    }
  };

  const applyExtraction = () => {
    if (!extraction) return;
    if (extraction.age) setAge(String(extraction.age));
    if (extraction.heightCm) setHeight(String(extraction.heightCm));
    if (extraction.weightKg) setWeight(String(extraction.weightKg));
    if (extraction.gender) setGender(extraction.gender);
    const extractedSeverity: Record<string, Severity> = {};
    const extractedSubtypes: Record<string, string> = {};
    extraction.conditions.forEach(condition => {
      if (condition.severity) extractedSeverity[condition.name] = condition.severity;
      if (condition.subtype) extractedSubtypes[condition.name] = condition.subtype;
    });
    setHealthConditions(extraction.conditions.map(condition => condition.name));
    setSeverity(extractedSeverity);
    setSubtypes(extractedSubtypes);
    setExtraction(null);
    modal.toast({ type: 'success', title: 'Details added', message: 'Review the fields, then continue onboarding.' });
  };

  const onboardingParams = (a?: number, h?: number, w?: number) => ({
    age: a,
    heightCm: h,
    weightKg: w,
    gender,
    activityLevel: activity,
    conditions: healthConditions.length ? healthConditions : undefined,
    severity,
    subtypes,
  });

  const next = () => {
    const a = Number(age);
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!valid) {
      modal.alert({ type: 'warning', title: 'A few more details', message: 'Please fill in every field, or tap “Skip for now”.' });
      return;
    }
    if (a < 10 || a > 110 || h < 100 || h > 230 || w < 25 || w > 250) {
      modal.alert({ type: 'warning', title: 'Check your numbers', message: 'Age, height or weight looks out of range.' });
      return;
    }
    navigation.navigate('MedicalHistory', onboardingParams(a, h, w));
  };

  return (
    <Screen
      header={<StepHeader step={1} />}
      footer={
        <>
          <PrimaryButton title="Continue" iconRight="arrow-right" onPress={next} />
          <TextButton title="Skip for now" tone="muted" onPress={() => navigation.navigate('MedicalHistory', onboardingParams())} />
        </>
      }
    >
      <View>
        <AppText variant="h1" style={styles.title}>
          Hi {firstName}, tell us{'\n'}about <AppText variant="h1" tone="red">you</AppText>
        </AppText>
        <AppText variant="body" tone="secondary">
          These basics help SmartHeal tune therapy intensity safely.
        </AppText>
      </View>

      <View>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField label="Age" placeholder="Years" value={age} onChangeText={t => setAge(t.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" />
            </View>
            <View style={styles.gap} />
            <View style={styles.flex}>
              <TextField label="Height (cm)" placeholder="170" value={height} onChangeText={t => setHeight(t.replace(/[^0-9.]/g, '').slice(0, 5))} keyboardType="decimal-pad" />
            </View>
            <View style={styles.gap} />
            <View style={styles.flex}>
              <TextField label="Weight (kg)" placeholder="70" value={weight} onChangeText={t => setWeight(t.replace(/[^0-9.]/g, '').slice(0, 5))} keyboardType="decimal-pad" />
            </View>
          </View>
          {bmi ? (
            <View style={styles.bmi}>
              <Icon name="scale-bathroom" size={18} color={colors.primary} />
              <AppText variant="small" tone="secondary" style={styles.bmiText}>
                BMI <AppText variant="bodyStrong">{bmi.value}</AppText> · {bmi.label}
              </AppText>
            </View>
          ) : null}
        </Card>
      </View>

      <View>
        <Card style={styles.reportCard}>
          <AppText variant="bodyStrong">Have a medical report?</AppText>
          <AppText variant="small" tone="secondary" style={styles.reportHint}>
            Agent can read a PDF or image and suggest profile details. You can review them before continuing.
          </AppText>
          <SecondaryButton
            title={scanningReport ? 'Scanning report…' : 'Upload medical report'}
            icon="file-upload-outline"
            loading={scanningReport}
            disabled={scanningReport}
            onPress={scanReport}
            style={styles.reportButton}
            compact
          />
          {extraction ? (
            <View style={styles.extraction}>
              <AppText variant="bodyStrong">Review extracted details</AppText>
              <AppText variant="small" tone="muted" style={styles.reportHint}>{reportFileName}</AppText>
              {extraction.age ? <AppText variant="small" style={styles.extractionLine}>Age: {extraction.age}</AppText> : null}
              {extraction.heightCm ? <AppText variant="small" style={styles.extractionLine}>Height: {extraction.heightCm} cm</AppText> : null}
              {extraction.weightKg ? <AppText variant="small" style={styles.extractionLine}>Weight: {extraction.weightKg} kg</AppText> : null}
              {extraction.gender ? <AppText variant="small" style={styles.extractionLine}>Gender: {GENDERS.find(option => option.value === extraction.gender)?.label}</AppText> : null}
              {extraction.conditions.map(condition => (
                <AppText key={condition.name} variant="small" style={styles.extractionLine}>
                  {condition.name}{condition.severity ? ` · ${condition.severity}` : ''}{condition.subtype ? ` · ${condition.subtype}` : ''}
                </AppText>
              ))}
              <AppText variant="caption" tone="muted" style={styles.reportHint}>
                AI extraction can be inaccurate. Confirm these values against your report.
              </AppText>
              <PrimaryButton title="Use these details" icon="check" onPress={applyExtraction} style={styles.applyButton} compact />
            </View>
          ) : null}
        </Card>
      </View>

      <View>
        <AppText variant="h3" style={styles.section}>
          Gender
        </AppText>
        <View style={styles.chips}>
          {GENDERS.map(g => (
            <Chip key={g.value} label={g.label} icon={g.icon} selected={gender === g.value} onPress={() => setGender(g.value)} />
          ))}
        </View>
      </View>

      <View>
        <AppText variant="h3" style={styles.section}>
          Activity level
        </AppText>
        {ACTIVITY_LEVELS.map(a => {
          const on = activity === a.value;
          return (
            <Card key={a.value} onPress={() => setActivity(a.value)} tint={on ? colors.primarySoft : undefined} style={[styles.option, on && styles.optionOn]} padding={14}>
              <View style={styles.optionRow}>
                <View style={[styles.optionIcon, on && styles.optionIconOn]}>
                  <Icon name={a.icon} size={20} color={on ? '#FFF' : colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText style={styles.optionTitle}>{a.label}</AppText>
                  <AppText variant="small" tone="muted">
                    {a.detail}
                  </AppText>
                </View>
                <Icon name={on ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={on ? colors.primary : colors.textMuted} />
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  title: { marginTop: 12, marginBottom: 6 },
  card: { marginTop: 22, paddingBottom: 4 },
  reportCard: { marginTop: 18 },
  reportHint: { marginTop: 6, lineHeight: 18 },
  reportButton: { marginTop: 12 },
  extraction: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  extractionLine: { marginTop: 5 },
  applyButton: { marginTop: 12 },
  row: { flexDirection: 'row' },
  flex: { flex: 1 },
  gap: { width: 10 },
  bmi: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 4 },
  bmiText: { marginLeft: 8 },
  section: { marginTop: 22, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  option: { marginBottom: 10 },
  optionOn: {},
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIconOn: { backgroundColor: colors.primary },
  optionTitle: { fontFamily: fonts.medium, fontWeight: '700', fontSize: 15 },
});
