/**
 * AnalysisScreen - "AI Scan" dock tab. Shows the form, then the report.
 * The form stays mounted (hidden) so the photo and values are kept when you go back.
 * "My reports" lists saved scans (Firestore via the backend) and opens them in the same report view.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import AnalysisFormScreen from './AnalysisFormScreen';
import AnalysisReportScreen from './AnalysisReportScreen';
import ReportsListScreen from './ReportsListScreen';
import { AnalyzeResponse, warmUpServer } from '../../../services/agentService';
import { ReportService, SavedReport } from '../../../services/reportService';
import { useAppModal } from '../../../components/feedback/AppModalProvider';
import { useUser } from '../../../context/UserContext';
import { useTheme } from '../../../theme';

export default function AnalysisScreen({ active }: { active: boolean }) {
  // fresh scan
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  // saved reports
  const [showReports, setShowReports] = useState(false);
  const [saved, setSaved] = useState<SavedReport | null>(null);
  const [opening, setOpening] = useState(false);

  const focused = useIsFocused();
  const { profile } = useUser();
  const { c } = useTheme();
  const modal = useAppModal();

  // wake the Cloud Run AI server when the tab opens (shorter first analysis)
  useEffect(() => {
    if (profile?.settings?.aiWarmUp !== false) warmUpServer();
  }, [profile?.settings?.aiWarmUp]);

  // Android back button: saved report -> list -> form, report -> form (only while this tab is on screen)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!active || !focused) return false;
      if (saved) setSaved(null);
      else if (showReports) setShowReports(false);
      else if (result) setResult(null);
      else return false;
      return true;
    });
    return () => sub.remove();
  }, [result, showReports, saved, active, focused]);

  const openReport = async (id: string) => {
    setOpening(true);
    try {
      setSaved(await ReportService.get(id));
    } catch (e: any) {
      modal.alert({ type: 'error', title: 'Could not open report', message: e?.message });
    } finally {
      setOpening(false);
    }
  };

  return (
    <View style={styles.fill}>
      <View style={[styles.fill, result || showReports ? styles.hidden : null]}>
        <AnalysisFormScreen
          onResult={(res, uri, id) => {
            setImageUri(uri);
            setReportId(id);
            setResult(res);
          }}
          onOpenReports={() => setShowReports(true)}
        />
      </View>
      {result && !showReports ? <AnalysisReportScreen result={result} imageUri={imageUri} reportId={reportId} onBack={() => setResult(null)} /> : null}

      {showReports ? (
        <View style={[styles.fill, saved ? styles.hidden : null]}>
          <ReportsListScreen onBack={() => setShowReports(false)} onOpen={openReport} />
        </View>
      ) : null}
      {showReports && saved ? (
        <AnalysisReportScreen
          result={saved.result}
          imageUri={saved.photo ? `data:image/jpeg;base64,${saved.photo}` : null}
          reportId={saved.id}
          savedAt={saved.createdAt}
          onBack={() => setSaved(null)}
        />
      ) : null}

      {opening ? (
        <View style={[styles.opening, { backgroundColor: c.overlay }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hidden: { display: 'none' },
  opening: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
