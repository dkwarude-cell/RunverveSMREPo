import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';
import { BodyArea, SessionMode, SessionConfig } from '../../models/Session';
import { protocolTemplates } from '../../services/session/protocolTemplates';
import BodyAreaSelector from '../../components/session/BodyAreaSelector';
import IntensityControl from '../../components/session/IntensityControl';
import Button from '../../components/common/Button';
import { BODY_AREAS } from '../../utils/constants';

interface Props { navigation: any }

const DURATIONS = [10, 15, 20, 30, 45, 60];

const SessionConfigScreen: React.FC<Props> = ({ navigation }) => {
  const [bodyArea, setBodyArea] = useState<BodyArea | null>(null);
  const [duration, setDuration] = useState(20);
  const [intensity, setIntensity] = useState(5);
  const [mode, setMode] = useState<SessionMode>('guided');
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);

  const protocols = useMemo(() => protocolTemplates, []);

  const handleStart = () => {
    if (!bodyArea) return;
    const config: SessionConfig = { bodyArea, duration, intensity, mode, protocolId: selectedProtocol ?? undefined };
    navigation.navigate('AIPlacement', { config });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configure Session</Text>

      {/* Mode */}
      <Text style={styles.label}>Mode</Text>
      <View style={styles.modeRow}>
        {(['guided', 'pro'] as const).map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
          >
            <Text style={[styles.modeTxt, mode === m && styles.modeTxtActive]}>{m.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Body Area */}
      <Text style={styles.label}>Target Area</Text>
      <BodyAreaSelector selected={bodyArea} onSelect={setBodyArea} />

      {/* Protocol */}
      <Text style={styles.label}>Protocol (optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.protocolScroll}>
        {protocols.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.protocolCard, selectedProtocol === p.id && styles.protocolActive]}
            onPress={() => setSelectedProtocol(selectedProtocol === p.id ? null : p.id)}
          >
            <Text style={[styles.protocolName, selectedProtocol === p.id && styles.protocolNameActive]}>{p.name}</Text>
            <Text style={styles.protocolDesc} numberOfLines={2}>{p.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Duration */}
      <Text style={styles.label}>Duration (min)</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.durationBtn, duration === d && styles.durationActive]}
            onPress={() => setDuration(d)}
          >
            <Text style={[styles.durationTxt, duration === d && styles.durationTxtActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Intensity */}
      <Text style={styles.label}>Starting Intensity</Text>
      <IntensityControl intensity={intensity} onChange={setIntensity} />

      <Button title="Continue to Placement" onPress={handleStart} disabled={!bodyArea} style={styles.startBtn} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.lg },
  label: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  modeRow: { flexDirection: 'row', gap: theme.spacing.sm },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.surface, alignItems: 'center' },
  modeBtnActive: { backgroundColor: theme.colors.primary },
  modeTxt: { fontWeight: '600', color: theme.colors.text.secondary },
  modeTxtActive: { color: '#fff' },
  protocolScroll: { marginBottom: theme.spacing.sm },
  protocolCard: { width: 140, padding: theme.spacing.sm, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.surface, marginRight: theme.spacing.sm },
  protocolActive: { borderWidth: 2, borderColor: theme.colors.primary },
  protocolName: { fontWeight: '600', fontSize: 14, color: theme.colors.text.primary, marginBottom: 4 },
  protocolNameActive: { color: theme.colors.primary },
  protocolDesc: { fontSize: 12, color: theme.colors.text.secondary },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  durationBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.surface },
  durationActive: { backgroundColor: theme.colors.primary },
  durationTxt: { fontWeight: '600', color: theme.colors.text.secondary },
  durationTxtActive: { color: '#fff' },
  startBtn: { marginTop: theme.spacing.xl },
});

export default SessionConfigScreen;
