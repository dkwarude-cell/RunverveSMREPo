import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { theme } from '../../styles/theme';
import { useSession } from '../../store/hooks/useSession';
import { useDevice } from '../../store/hooks/useDevice';
import SessionTimer from '../../components/session/SessionTimer';
import IntensityControl from '../../components/session/IntensityControl';
import SessionControls from '../../components/session/SessionControls';
import { SessionConfig } from '../../models/Session';

interface Props { navigation: any; route: { params: { config: SessionConfig } } }

const ActiveSessionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { config } = route.params;
  const {
    sessionState, timeRemaining, currentIntensity,
    start, pause, resume, stop, setIntensity, timerTick,
  } = useSession();
  const { connectedDevice } = useDevice();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive = sessionState === 'active';
  const isPaused = sessionState === 'paused';

  // Start session on mount
  useEffect(() => {
    start(config);
  }, []);

  // Tick timer
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => timerTick(), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, isPaused]);

  // Auto-stop when duration reached
  useEffect(() => {
    if (isActive && timeRemaining <= 0) {
      handleStop();
    }
  }, [timeRemaining]);

  const handlePause = () => isPaused ? resume() : pause();

  const handleStop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stop();
    navigation.replace('SessionComplete', { config, elapsedSeconds: config.duration * 60 - timeRemaining, intensity: currentIntensity });
  }, [timeRemaining, currentIntensity]);

  const confirmStop = () => {
    Alert.alert('End Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: handleStop },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header info */}
      <View style={styles.header}>
        <Text style={styles.areaLabel}>{config.bodyArea.replace(/_/g, ' ')}</Text>
        <Text style={styles.modeLabel}>{config.mode.toUpperCase()}</Text>
      </View>

      {/* Timer */}
      <View style={styles.timerSection}>
        <SessionTimer timeRemaining={timeRemaining} isActive={isActive} />
      </View>

      {/* Intensity */}
      <View style={styles.intensitySection}>
        <Text style={styles.sectionLabel}>Intensity</Text>
        <IntensityControl intensity={currentIntensity} onChange={setIntensity} />
      </View>

      {/* Device Status */}
      {connectedDevice && (
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceText}>🔗 {connectedDevice.name ?? connectedDevice.deviceName}</Text>
        </View>
      )}

      {/* Controls */}
      <SessionControls
        state={isPaused ? 'paused' : isActive ? 'active' : 'idle'}
        onStart={() => start(config)}
        onPause={handlePause}
        onResume={handlePause}
        onStop={confirmStop}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  areaLabel: { fontSize: 20, fontWeight: '700', color: theme.colors.text.primary, textTransform: 'capitalize' },
  modeLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.primary, backgroundColor: theme.colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timerSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  intensitySection: { marginBottom: theme.spacing.lg },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: theme.spacing.sm },
  deviceInfo: { alignItems: 'center', marginBottom: theme.spacing.md },
  deviceText: { fontSize: 13, color: theme.colors.text.secondary },
});

export default ActiveSessionScreen;
