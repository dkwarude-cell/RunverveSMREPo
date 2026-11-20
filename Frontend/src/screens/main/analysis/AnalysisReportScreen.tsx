import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, PrimaryButton, SecondaryButton } from '../../../components/ui/Buttons';
import { useAppModal } from '../../../components/feedback/AppModalProvider';
import { ReportService } from '../../../services/reportService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { DOCK_SPACE, fonts, useTheme } from '../../../theme';
import type { AiColors } from '../../../theme';

import { AnalyzeResponse } from '../../../services/agentService';
import { SectionKey, deviceVerdicts, modelCheck, parseAnalysis } from '../../../utils/markdown';
import { heatRows, percent, prettyLabel, tensRows, vibrationRows } from '../../../utils/format';
import { MarkdownBlocks } from '../../../components/ai/RichText';
import { ConfidenceBar, SectionCard, StatusBadge, TherapyTable } from '../../../components/ai/ResultParts';

interface Props {
  result: AnalyzeResponse;
  imageUri: string | null;
  onBack: () => void;
  reportId?: string | null; // saved report (needed for the PDF export)
  savedAt?: string | null; // set when opened from "My reports"
}

const sectionStyle = (Colors: AiColors): Record<SectionKey, { icon: string; color: string; tint?: string }> => ({
  model_check: { icon: 'robot-outline', color: Colors.info },
  observations: { icon: 'eye-outline', color: Colors.primary },
  explanations: { icon: 'lightbulb-on-outline', color: Colors.moderate },
  severity: { icon: 'gauge', color: Colors.primary },
  next_steps: { icon: 'clipboard-check-outline', color: Colors.success },
  devices: { icon: 'tune-variant', color: Colors.primary },
  warnings: { icon: 'alert-outline', color: Colors.danger, tint: Colors.dangerSoft },
  other: { icon: 'text-box-outline', color: Colors.primary },
});

const severityStyle = (Colors: AiColors) => ({
  mild: { color: Colors.mild, bg: Colors.successSoft, icon: 'shield-check-outline', text: 'Mild' },
  moderate: { color: Colors.moderate, bg: Colors.warningSoft, icon: 'alert-outline', text: 'Moderate' },
  severe: { color: Colors.severe, bg: Colors.dangerSoft, icon: 'alert-octagon-outline', text: 'Severe' },
});

export default function AnalysisReportScreen({ result, imageUri, onBack, reportId, savedAt }: Props) {
  const modal = useAppModal();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [exporting, setExporting] = useState(false);
  const startTherapy = () =>
    navigation.navigate('TherapySession', {
      therapy: result.therapy_model,
      reportId: reportId ?? null,
      bodyPart: result.confirmed_body_part ?? result.cnn?.body_part?.label ?? null,
      painBefore: typeof result.inputs?.pain_level === 'number' ? result.inputs.pain_level : null,
    });
  const exportPdf = async () => {
    if (!reportId) {
      modal.alert({ type: 'warning', title: 'Report not saved', message: 'This report could not be saved, so it cannot be exported. Check your connection and run the scan again.' });
      return;
    }
    setExporting(true);
    try {
      await ReportService.exportPdf(reportId);
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Export failed', message: e?.message });
    } finally {
      setExporting(false);
    }
  };
  const insets = useSafeAreaInsets();
  const { ai: Colors, c } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const SECTION_STYLE = sectionStyle(Colors);
  const SEVERITY_STYLE = severityStyle(Colors);
  const parsed = useMemo(() => parseAnalysis(result.analysis), [result.analysis]);
  const devices = useMemo(() => deviceVerdicts(parsed), [parsed]);
  const check = useMemo(() => modelCheck(parsed), [parsed]);
  const t = result.therapy_model;
  const sev = parsed.severity ? SEVERITY_STYLE[parsed.severity] : null;
  const body = result.cnn.body_part;
  const wound = result.cnn.wound;

  // headline: trust the AI agent when it disagrees with the CNN
  const swellingYes = !!check.swelling && /^\s*yes/i.test(check.swelling);
  const woundAgreed = check.wound ? check.wound.agree : true;
  const bodyAgreed = check.bodyPart ? check.bodyPart.agree : true;
  const headline = woundAgreed
    ? prettyLabel(wound.label) + (swellingYes && wound.label === 'No_Wound' ? ' · swelling' : '')
    : swellingYes
      ? 'Swelling'
      : 'Needs review';
  const subline = result.confirmed_body_part
    ? `You confirmed: ${prettyLabel(result.confirmed_body_part)}`
    : bodyAgreed
      ? `on the ${prettyLabel(body.label).toLowerCase()}`
      : 'body part corrected by AI';

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <IconButton icon="chevron-left" onPress={onBack} size={42} />
        <View style={styles.headerText}>
          <Text style={styles.headerKicker}>AI Injury Scan</Text>
          <Text style={styles.headerTitle}>SmartHeal Report</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ───── Summary ───── */}
        <View style={styles.summary}>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.photo} /> : null}
          <View style={styles.summaryRight}>
            <Text style={styles.summaryKicker}>
              {savedAt ? new Date(savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Analysis complete'}
            </Text>
            <Text style={styles.summaryTitle}>{headline}</Text>
            <Text style={styles.summarySub}>{subline}</Text>
            {!woundAgreed ? (
              <Text style={styles.summaryNote}>CNN suggested {prettyLabel(wound.label)} – the AI agent disagreed</Text>
            ) : null}
            {sev ? (
              <View style={[styles.sevPill, { backgroundColor: sev.bg }]}>
                <Icon name={sev.icon} size={16} color={sev.color} />
                <Text style={[styles.sevText, { color: sev.color }]}>Severity: {sev.text}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ───── AI models ───── */}
        <SectionCard icon="chip" title="AI Model Predictions" color={Colors.info}>
          <ConfidenceBar title="Body part · ResNet50" label={prettyLabel(body.label)} confidence={body.confidence} verdict={check.bodyPart} />
          <ConfidenceBar title="Wound type · ResNet50" label={prettyLabel(wound.label)} confidence={wound.confidence} verdict={check.wound} />
          {check.swelling ? (
            <View style={styles.inlineRow}>
              <Icon name="water-outline" size={18} color={Colors.info} />
              <Text style={styles.inlineText}>
                <Text style={styles.inlineLabel}>Swelling (judged by AI): </Text>
                {check.swelling}
              </Text>
            </View>
          ) : null}
          <Text style={styles.otherGuesses}>
            Other guesses: {body.top3.slice(1).map(p => `${prettyLabel(p.label)} ${percent(p.confidence)}`).join(', ')}
            {'  |  '}
            {wound.top3.slice(1).map(p => `${prettyLabel(p.label)} ${percent(p.confidence)}`).join(', ')}
          </Text>
        </SectionCard>

        {/* ───── Therapy plan ───── */}
        <SectionCard icon="tune-variant" title="Recommended Therapy" color={Colors.primary}>
          {check.therapy ? (
            <View style={styles.therapyVerdict}>
              <StatusBadge kind={/adjust/i.test(check.therapy) ? 'warn' : 'good'} text={/adjust/i.test(check.therapy) ? 'AI adjusted the model' : 'AI confirmed the model'} />
              <Text style={styles.therapyVerdictText}>{check.therapy}</Text>
            </View>
          ) : null}
          <TherapyTable icon="fire" title="Heat Therapy" color={Colors.heat} rows={heatRows(t)} verdict={devices.heat} />
          <TherapyTable icon="vibrate" title="Vibration Therapy" color={Colors.vibration} rows={vibrationRows(t)} verdict={devices.vibration} />
          <TherapyTable icon="flash" title="TENS Therapy" color={Colors.tens} rows={tensRows(t)} verdict={devices.tens} />
          {result.safety_adjustments?.length ? (
            <View style={styles.safetyBox}>
              <Icon name="shield-check-outline" size={16} color={Colors.success} />
              <Text style={styles.safetyText}>Safety rules applied: {result.safety_adjustments.join('; ')}</Text>
            </View>
          ) : null}
        </SectionCard>

        {/* ───── Agent analysis (all sections except device parameters, shown above as tables) ───── */}
        {parsed.intro.length ? (
          <SectionCard icon="text-box-outline" title="Summary">
            <MarkdownBlocks blocks={parsed.intro} />
          </SectionCard>
        ) : null}

        {parsed.sections
          .filter(s => s.key !== 'devices')
          .map((s, i) => {
            const st = SECTION_STYLE[s.key];
            const title = s.key === 'model_check' ? 'AI Verification' : s.title.replace(/\s*\(general\)\s*/i, '');
            return (
              <SectionCard key={`${s.key}-${i}`} icon={st.icon} title={title} color={st.color} tint={st.tint}>
                <MarkdownBlocks blocks={s.blocks} accent={st.color} />
              </SectionCard>
            );
          })}

        {/* fallback: if the answer had no recognisable sections, show it as plain text */}
        {parsed.sections.length === 0 && parsed.intro.length === 0 ? (
          <SectionCard icon="text-box-outline" title="AI Analysis">
            <Text style={styles.plain}>{result.analysis}</Text>
          </SectionCard>
        ) : null}

        {/* ───── Disclaimer ───── */}
        <View style={styles.disclaimer}>
          <Icon name="doctor" size={20} color={Colors.subText} />
          <Text style={styles.disclaimerText}>
            {parsed.disclaimer ??
              'This AI analysis is not a replacement for a doctor. Please consult a qualified medical professional for diagnosis and personalized treatment.'}
          </Text>
        </View>

        <Text style={styles.timing}>
          Models {result.timing_ms.models} ms · AI agent {(result.timing_ms.agent / 1000).toFixed(1)} s
        </Text>

        <PrimaryButton title="Start therapy" icon="play" onPress={startTherapy} style={styles.newButton} />
        <SecondaryButton title="Export PDF for doctor" icon="file-pdf-box" loading={exporting} onPress={exportPdf} style={styles.secondButton} />
        <SecondaryButton
          title={savedAt ? 'Back to my reports' : 'New analysis'}
          icon={savedAt ? 'file-document-multiple-outline' : 'camera-plus-outline'}
          onPress={onBack}
          style={styles.secondButton}
        />
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: AiColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  headerText: { marginLeft: 12 },
  headerKicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: Colors.primary, textTransform: 'uppercase' },
  headerTitle: { fontFamily: fonts.bold, fontSize: 21, fontWeight: '700', color: Colors.text },
  content: { padding: 16, paddingBottom: DOCK_SPACE },

  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
  },
  photo: { width: 96, height: 96, borderRadius: 14, backgroundColor: Colors.border },
  summaryRight: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  summaryKicker: { fontSize: 12, fontWeight: '700', color: Colors.success, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 24, fontWeight: '700', color: Colors.text, marginTop: 2 },
  summarySub: { fontSize: 14, color: Colors.subText, marginTop: 1 },
  summaryNote: { fontSize: 12, color: Colors.warning, marginTop: 4 },
  sevPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  sevText: { fontSize: 13, fontWeight: '800', marginLeft: 5 },

  inlineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  inlineText: { flex: 1, marginLeft: 8, fontSize: 14, color: Colors.text, lineHeight: 20 },
  inlineLabel: { fontWeight: '700' },
  otherGuesses: { fontSize: 12, color: Colors.muted, lineHeight: 17 },

  therapyVerdict: { marginBottom: 12 },
  therapyVerdictText: { fontSize: 13.5, color: Colors.text, marginTop: 6, lineHeight: 19 },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.successSoft,
    borderRadius: 10,
    padding: 10,
  },
  safetyText: { flex: 1, marginLeft: 6, fontSize: 12.5, color: Colors.text, lineHeight: 18 },

  plain: { fontSize: 14.5, lineHeight: 22, color: Colors.text },

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  disclaimerText: { flex: 1, marginLeft: 10, fontSize: 13, lineHeight: 19, fontStyle: 'italic', color: Colors.subText },
  timing: { textAlign: 'center', fontSize: 11, color: Colors.muted, marginTop: 12 },
  newButton: { marginTop: 18 },
  secondButton: { marginTop: 10 },
});
