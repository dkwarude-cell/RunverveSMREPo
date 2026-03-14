import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { theme } from '../../styles/theme';
import { useAI } from '../../store/hooks/useAI';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { SessionConfig } from '../../models/Session';

interface Props { navigation: any; route: { params: { config: SessionConfig } } }

const AIPlacementScreen: React.FC<Props> = ({ navigation, route }) => {
  const { config } = route.params;
  const { modelLoaded, loading: isProcessing, loadModel } = useAI();
  const [validated, setValidated] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  useEffect(() => {
    loadModel();
  }, []);

  const handleSkip = () => {
    navigation.replace('ActiveSession', { config });
  };

  const handleValidated = () => {
    setValidated(true);
    setAccuracy(85); // placeholder
  };

  const handleContinue = () => {
    navigation.replace('ActiveSession', { config });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Electrode Placement</Text>
      <Text style={styles.subtitle}>Target: {config.bodyArea.replace(/_/g, ' ')}</Text>

      <View style={styles.cameraPlaceholder}>
        {!modelLoaded ? (
          <LoadingSpinner message="Loading AI model..." />
        ) : (
          <View style={styles.cameraBox}>
            <Text style={styles.cameraText}>📷 Camera Preview</Text>
            <Text style={styles.cameraHint}>Position the device near your {config.bodyArea.replace(/_/g, ' ')}</Text>
          </View>
        )}
      </View>

      {validated && accuracy !== null && (
        <View style={styles.result}>
          <Text style={styles.resultLabel}>Placement Accuracy</Text>
          <Text style={[styles.resultValue, accuracy >= 70 ? styles.good : styles.poor]}>{accuracy}%</Text>
          <Text style={styles.resultHint}>{accuracy >= 70 ? 'Great placement!' : 'Try adjusting electrode position'}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {!validated ? (
          <>
            <Button title="Validate Placement" onPress={handleValidated} disabled={!modelLoaded} />
            <Button title="Skip" onPress={handleSkip} variant="outline" style={styles.skipBtn} />
          </>
        ) : (
          <Button title="Start Session" onPress={handleContinue} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text.primary },
  subtitle: { fontSize: 15, color: theme.colors.text.secondary, marginTop: 4, textTransform: 'capitalize' },
  cameraPlaceholder: { flex: 1, marginVertical: theme.spacing.lg, borderRadius: theme.borderRadius.lg, overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  cameraBox: { alignItems: 'center' },
  cameraText: { fontSize: 48 },
  cameraHint: { color: '#999', marginTop: theme.spacing.sm, textTransform: 'capitalize' },
  result: { alignItems: 'center', marginBottom: theme.spacing.lg },
  resultLabel: { fontSize: 14, color: theme.colors.text.secondary },
  resultValue: { fontSize: 36, fontWeight: '700', marginVertical: 4 },
  good: { color: theme.colors.success },
  poor: { color: theme.colors.error },
  resultHint: { fontSize: 14, color: theme.colors.text.secondary },
  actions: { gap: theme.spacing.sm },
  skipBtn: { marginTop: 4 },
});

export default AIPlacementScreen;
