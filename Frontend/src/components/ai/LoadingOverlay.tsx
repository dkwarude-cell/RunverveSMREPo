/**
 * LoadingOverlay - shown while the AI pipeline runs, with a simple stage checklist.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts, radius, useTheme } from '../../theme';

const STEPS = [
  { text: 'Uploading photo' },
  { text: 'Detecting body part and wound', sub: 'ResNet50' },
  { text: 'Predicting therapy settings', sub: 'Random Forest' },
  { text: 'AI agent verifying results', sub: 'Gemini' },
  { text: 'Preparing your report' },
];

export default function LoadingOverlay() {
  const { c } = useTheme();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
      <View style={[styles.card, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={[styles.title, { color: c.text }]}>Analysing…</Text>
        <View style={styles.list}>
          {STEPS.map((s, i) => {
            const done = i < step;
            const now = i === step;
            return (
              <View key={s.text} style={styles.stepRow}>
                <Icon name={done ? 'check-circle' : now ? 'progress-clock' : 'circle-outline'} size={18} color={done || now ? c.primary : c.textMuted} />
                <Text style={[styles.stepText, { color: now ? c.text : c.textMuted }, now && styles.bold]}>
                  {s.text}
                  {s.sub ? <Text style={{ color: c.primary }}>{`  ${s.sub}`}</Text> : null}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.hint, { color: c.textMuted }]}>Usually 15–30 seconds (the first scan of the day can take longer)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 50 },
  card: { width: '100%', maxWidth: 360, borderRadius: radius.xl, padding: 22, alignItems: 'center' },
  title: { marginTop: 14, fontFamily: fonts.bold, fontSize: 20, fontWeight: '800' },
  list: { alignSelf: 'stretch', marginTop: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  stepText: { marginLeft: 10, fontSize: 14, flex: 1 },
  bold: { fontWeight: '700' },
  hint: { marginTop: 14, fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
});
