import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Asset, ImagePickerResponse, launchCamera, launchImageLibrary } from 'react-native-image-picker';

import TabHeader from '../../../components/layout/TabHeader';
import { useAppModal } from '../../../components/feedback/AppModalProvider';
import { useUser } from '../../../context/UserContext';
import { useMainNav } from '../../../components/layout/MainNavContext';
import { PrimaryButton } from '../../../components/ui/Buttons';
import { DOCK_SPACE, useTheme } from '../../../theme';
import type { AiColors } from '../../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImagePickerCard from '../../../components/ai/ImagePickerCard';
import AnalyzeButton from '../../../components/ai/AnalyzeButton';
import LoadingOverlay from '../../../components/ai/LoadingOverlay';
import { CheckRow, ChipSelector, FormCard, NumberField } from '../../../components/ai/FormControls';
import { AnalyzeResponse, PatientInputs, PickedImage, analyzeSmartHeal } from '../../../services/agentService';
import { calcBmi, estimateBodyFat } from '../../../utils/format';
import type { UserProfileData } from '../../../services/authService';
import { ReportService } from '../../../services/reportService';
import { modelCheck, parseAnalysis } from '../../../utils/markdown';
import { ListRow } from '../../../components/ui/Bits';
import BodyPainPicker from '../../../components/body/BodyPainPicker';
import {
  BodySelection,
  describeSelection,
  regionForAiLabel,
} from '../../../data/bodyMap';

interface Props {
  onResult: (result: AnalyzeResponse, imageUri: string, reportId: string | null) => void;
  onOpenReports: () => void;
}

// normal skin temperature - the model needs one and the device doesn't measure it
const SKIN_TEMP_C = 34.5;

/**
 * Body inputs for the model, taken from the profile filled in during onboarding (no need to ask again here).
 * Returns the names of the missing fields instead when the profile isn't complete (e.g. onboarding was skipped).
 */
function bodyInputsFromProfile(profile: UserProfileData | null | undefined) {
  const age = profile?.age && profile.age >= 18 && profile.age <= 100 ? Math.round(profile.age) : undefined;
  const height = profile?.heightCm && profile.heightCm >= 120 && profile.heightCm <= 220 ? profile.heightCm : undefined;
  const weight = profile?.weightKg && profile.weightKg >= 30 && profile.weightKg <= 200 ? profile.weightKg : undefined;
  if (!age || !height || !weight) {
    const missing = [!age && 'age', !height && 'height', !weight && 'weight'].filter(Boolean) as string[];
    return { missing };
  }
  const bmi = calcBmi(height, weight);
  // body fat estimate needs a sex - use the average of both when gender is other / not given
  const bodyFat =
    profile?.gender === 'male' || profile?.gender === 'female'
      ? estimateBodyFat(bmi, age, profile.gender === 'male' ? 'Male' : 'Female')
      : Math.round(((estimateBodyFat(bmi, age, 'Male') + estimateBodyFat(bmi, age, 'Female')) / 2) * 10) / 10;
  return {
    missing: [] as string[],
    body: {
      age,
      bmi,
      body_fat_percent: bodyFat,
      skin_temperature_c: SKIN_TEMP_C,
      diabetic: (profile?.conditions?.includes('Diabetes') ? 1 : 0) as 0 | 1,
    },
  };
}

const PICKER_OPTIONS = {
  mediaType: 'photo' as const,
  quality: 0.8 as const,
  maxWidth: 1600,
  maxHeight: 1600,
  includeBase64: true, // for the thumbnail in the saved report
};

export default function AnalysisFormScreen({ onResult, onOpenReports }: Props) {
  const { ai: Colors, c } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const modal = useAppModal();
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const { openProfile } = useMainNav();
  // photo
  const [image, setImage] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingResult, setPendingResult] = useState<AnalyzeResponse | null>(null);
  // where it hurts, chosen on the body map before the photo and confirmed after it
  const [bodySelections, setBodySelections] = useState<BodySelection[]>([]);
  /** The region the image model pointed at, outlined on the map as a hint only. */
  const suggestedRegionId = useMemo(
    () => (pendingResult ? regionForAiLabel(pendingResult.cnn.body_part.label)?.id ?? null : null),
    [pendingResult],
  );
  /** What gets saved and passed on: every area the user marked, in their own words. */
  const confirmedBodyPart = useMemo(
    () => bodySelections.map(describeSelection).join('; '),
    [bodySelections],
  );

  // pain profile
  const [pain, setPain] = useState(5);
  const [weeks, setWeeks] = useState(2);
  const [burning, setBurning] = useState(false);
  const [tingling, setTingling] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [stiffness, setStiffness] = useState(3);
  const [spasm, setSpasm] = useState(3);

  const { body, missing } = useMemo(() => bodyInputsFromProfile(profile), [profile]);
  const neuroScore = Number(burning) + Number(tingling) + Number(shooting);

  // ───────── photo ─────────
  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) return;
    if (response.errorCode) {
      modal.alert({ type: 'error', title: 'Image error', message: response.errorMessage || 'Image selection failed' });
      return;
    }
    const asset: Asset | undefined = response.assets?.[0];
    if (asset?.uri) {
      setImage({ uri: asset.uri, type: asset.type, fileName: asset.fileName, base64: asset.base64 });
      setPendingResult(null);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: 'Camera Permission',
        message: 'SmartHeal needs access to your camera to take photos of the affected area.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const pickFromGallery = () => launchImageLibrary(PICKER_OPTIONS, handleImageResponse);

  const openCamera = async () => {
    if (await requestCameraPermission()) {
      launchCamera(PICKER_OPTIONS, handleImageResponse);
    } else {
      modal.alert({ type: 'warning', icon: 'camera-off', title: 'Camera permission needed', message: 'Allow camera access in Settings to take photos.' });
    }
  };

  // ───────── analyze ─────────
  const analyze = async () => {
    if (!image) {
      modal.alert({ type: 'warning', icon: 'image-plus', title: 'Photo needed', message: 'Please add a photo of the affected area first.' });
      return;
    }
    if (!body) {
      modal.alert({ type: 'warning', icon: 'account-edit-outline', title: 'Complete your profile', message: `Please add your ${missing.join(', ')} in your profile first.` });
      return;
    }
    const inputs: PatientInputs = {
      ...body,
      pain_level: pain,
      pain_duration_weeks: weeks,
      neuropathic_score: neuroScore,
      stiffness_level: stiffness,
      muscle_spasm_level: spasm,
    };
    setLoading(true);
    try {
      const result = await analyzeSmartHeal(image, inputs);
      setPendingResult(result);
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Analysis failed', message: e?.message ?? 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const confirmBodyPart = async () => {
    if (!pendingResult || bodySelections.length === 0 || !image) return;

    const confirmedResult: AnalyzeResponse = {
      ...pendingResult,
      confirmed_body_part: confirmedBodyPart,
      body_selections: bodySelections,
    };
    setLoading(true);
    try {
      // save to "My reports" - the report still opens if saving fails
      let reportId: string | null = null;
      try {
        const summary = { bodyPart: confirmedBodyPart, wound: confirmedResult.cnn.wound.label, severity: parseAnalysis(confirmedResult.analysis).severity ?? null };
        reportId = await ReportService.save(confirmedResult, summary, image.base64);
      } catch (e: any) {
        modal.toast({ type: 'warning', title: 'Report not saved', message: e?.message });
      }
      onResult(confirmedResult, image.uri, reportId);
      setPendingResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TabHeader
            kicker="ResNet50 · Random Forest · Gemini"
            title="AI Injury Scan"
            subtitle="Photo + pain profile → personal therapy plan (age, BMI etc. come from your profile)."
          />
          <View style={styles.headerGap} />

          <View style={[styles.reportsRow, { backgroundColor: c.surface }]}>
            <ListRow icon="file-document-multiple-outline" label="My reports" onPress={onOpenReports} last />
          </View>

          {pendingResult ? null : (
          <FormCard icon="human-handsup" title="Where does it hurt?">
            <Text style={styles.hint}>
              Tap the area on the body, then say what you think it is. This is sent with your
              photo so the analysis knows which part of you it is looking at.
            </Text>
            <View style={styles.bodyPicker}>
              <BodyPainPicker selections={bodySelections} onChange={setBodySelections} />
            </View>
          </FormCard>
          )}

          <ImagePickerCard imageUri={image?.uri ?? null} onGallery={pickFromGallery} onCamera={openCamera} />

          {pendingResult ? (
            <FormCard icon="map-marker-check-outline" title="Confirm the body part">
              <Text style={styles.hint}>
                The photo suggests the area below. Check it against where it actually hurts and correct it on the body if it is wrong.
              </Text>
              <View style={styles.predictionSummary}>
                <Text style={styles.predictionTitle}>Model suggestion</Text>
                <Text style={styles.predictionText}>
                  {pendingResult.cnn.body_part.label.replace(/_/g, ' ')}
                </Text>
                <Text style={[styles.predictionTitle, styles.agentTitle]}>Gemini agent assessment</Text>
                <Text style={styles.predictionText}>
                  {modelCheck(parseAnalysis(pendingResult.analysis)).bodyPart?.text ||
                    'No separate body-part assessment was returned.'}
                </Text>
                <Text style={styles.predictionFootnote}>
                  The analysis service builds its therapy plan before this step, so your choice does not change the plan itself. It is saved with the report and used to set the safe limits for the area during the session.
                </Text>
              </View>
              <View style={styles.bodyPicker}>
                <BodyPainPicker
                  selections={bodySelections}
                  onChange={setBodySelections}
                  suggestedId={suggestedRegionId}
                />
              </View>
              <PrimaryButton
                title="Confirm body part"
                icon="check"
                disabled={bodySelections.length === 0 || loading}
                loading={loading}
                onPress={confirmBodyPart}
                style={styles.field}
              />
            </FormCard>
          ) : null}

          {body ? null : (
            <FormCard icon="account-alert-outline" title="Complete your profile">
              <Text style={styles.hint}>
                The AI uses your age, height and weight from your profile. Please add your {missing.join(', ')} first.
              </Text>
              <PrimaryButton title="Open profile" icon="account-edit-outline" compact onPress={openProfile} style={styles.field} />
            </FormCard>
          )}

          <FormCard icon="pulse" title="Pain Profile">
            <ChipSelector label="Pain level" value={pain} onChange={setPain} min={1} max={10} lowText="Mild" highText="Worst" />
            <NumberField
              label="Pain duration"
              value={weeks}
              onChange={setWeeks}
              min={0}
              max={520}
              unit="weeks"
              hint={weeks >= 12 ? 'Chronic pain (12+ weeks)' : 'Acute pain (under 12 weeks)'}
            />
            <View style={styles.field}>
              <Text style={styles.label}>Nerve-pain signs (tick all you feel)</Text>
              <CheckRow label="Burning" checked={burning} onToggle={() => setBurning(b => !b)} />
              <CheckRow label="Tingling / numbness" sub="Pins and needles" checked={tingling} onToggle={() => setTingling(t => !t)} />
              <CheckRow label="Shooting / electric" sub="Sudden sharp jolts" checked={shooting} onToggle={() => setShooting(s => !s)} />
              <Text style={styles.hint}>Neuropathic score: {neuroScore}/3</Text>
            </View>
            <ChipSelector label="Stiffness" value={stiffness} onChange={setStiffness} min={0} max={10} lowText="None" highText="Very stiff" />
            <ChipSelector label="Muscle spasm" value={spasm} onChange={setSpasm} min={0} max={10} lowText="None" highText="Severe" />
          </FormCard>

          {!pendingResult ? (
            <AnalyzeButton label="Analyze with SmartHeal" disabled={!image || loading} onPress={analyze} />
          ) : null}
          <Text style={styles.footer}>
            SmartHeal gives AI-based guidance only. Always consult a qualified medical professional.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      {loading && <LoadingOverlay />}
    </View>
  );
}

const makeStyles = (Colors: AiColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: DOCK_SPACE },
  field: { marginTop: 14 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  hint: { marginTop: 4, fontSize: 12, color: Colors.subText },
  headerGap: { height: 18 },
  reportsRow: { borderRadius: 16, paddingHorizontal: 14, marginBottom: 14 },
  footer: { marginTop: 14, fontSize: 12, color: Colors.muted, textAlign: 'center', lineHeight: 17 },
  predictionSummary: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: Colors.surface },
  predictionTitle: { fontSize: 12, fontWeight: '700', color: Colors.subText, textTransform: 'uppercase' },
  agentTitle: { marginTop: 10 },
  predictionText: { marginTop: 3, fontSize: 14, color: Colors.text, lineHeight: 19 },
  predictionFootnote: { marginTop: 10, fontSize: 12, color: Colors.muted, lineHeight: 17 },
  bodyPicker: { height: 420, marginTop: 12 },
});
