/**
 * ResultParts.tsx - building blocks of the Result screen.
 *  SectionCard    : card with an icon title
 *  StatusBadge    : coloured pill with icon + text
 *  ConfidenceBar  : model prediction with a confidence bar
 *  TherapyTable   : one device (Heat / Vibration / TENS) as a parameter table with the AI verdict
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme';
import type { AiColors } from '../../theme';
import type { DeviceVerdict } from '../../utils/markdown';
import type { Row } from '../../utils/format';

// ───────────── SectionCard ─────────────
export function SectionCard({
  icon,
  title,
  color: colorProp,
  tint,
  children,
}: {
  icon: string;
  title: string;
  color?: string;
  tint?: string;
  children: React.ReactNode;
}) {
  const { ai: Colors } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const color = colorProp ?? Colors.primary;
  return (
    <View style={[styles.card, tint ? { backgroundColor: tint } : null]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: color + '1A' }]}>
          <Icon name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.cardTitle, { color: tint ? color : Colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ───────────── StatusBadge ─────────────
export type BadgeKind = 'good' | 'warn' | 'bad' | 'info';

const badgeStyle = (Colors: AiColors): Record<BadgeKind, { fg: string; bg: string; icon: string }> => ({
  good: { fg: Colors.success, bg: Colors.successSoft, icon: 'check-circle' },
  warn: { fg: Colors.warning, bg: Colors.warningSoft, icon: 'alert-circle' },
  bad: { fg: Colors.danger, bg: Colors.dangerSoft, icon: 'close-circle' },
  info: { fg: Colors.info, bg: Colors.infoSoft, icon: 'information' },
});

export function StatusBadge({ kind, text }: { kind: BadgeKind; text: string }) {
  const { ai: Colors } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const b = badgeStyle(Colors)[kind];
  return (
    <View style={[styles.badge, { backgroundColor: b.bg }]}>
      <Icon name={b.icon} size={14} color={b.fg} />
      <Text style={[styles.badgeText, { color: b.fg }]}>{text}</Text>
    </View>
  );
}

// ───────────── ConfidenceBar ─────────────
export function ConfidenceBar({
  title,
  label,
  confidence,
  verdict,
}: {
  title: string;
  label: string;
  confidence: number;
  verdict?: { agree: boolean; text: string };
}) {
  const { ai: Colors } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? Colors.success : pct >= 60 ? Colors.moderate : Colors.danger;
  return (
    <View style={styles.pred}>
      <View style={styles.predTop}>
        <Text style={styles.predTitle}>{title}</Text>
        {verdict ? (
          <StatusBadge kind={verdict.agree ? 'good' : 'warn'} text={verdict.agree ? 'AI agrees' : 'AI disagrees'} />
        ) : null}
      </View>
      <View style={styles.predRow}>
        <Text style={styles.predLabel}>{label}</Text>
        <Text style={[styles.predPct, { color }]}>{pct}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      {verdict && !verdict.agree ? <Text style={styles.predNote}>{verdict.text}</Text> : null}
    </View>
  );
}

// ───────────── TherapyTable ─────────────
const VERDICT: Record<DeviceVerdict['status'], { kind: BadgeKind; text: string }> = {
  confirmed: { kind: 'good', text: 'Confirmed by AI' },
  adjusted: { kind: 'warn', text: 'Adjusted by AI' },
  not_recommended: { kind: 'bad', text: 'Not recommended' },
  model: { kind: 'info', text: 'Model prediction' },
};

export function TherapyTable({
  icon,
  title,
  color,
  rows,
  verdict,
}: {
  icon: string;
  title: string;
  color: string;
  rows: Row[];
  verdict: DeviceVerdict;
}) {
  const { ai: Colors } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const v = VERDICT[verdict.status];
  const off = verdict.status === 'not_recommended';
  return (
    <View style={[styles.device, { backgroundColor: color + (Colors.background === '#000000' ? '1F' : '14') }]}>
      <View style={[styles.deviceHead, { backgroundColor: color + (Colors.background === '#000000' ? '33' : '26') }]}>
        <View style={styles.deviceTitleRow}>
          <Icon name={icon} size={20} color={color} />
          <Text style={[styles.deviceTitle, { color }]}>{title}</Text>
        </View>
        <StatusBadge kind={v.kind} text={v.text} />
      </View>

      {off ? (
        <View style={styles.offBox}>
          <Text style={styles.offTitle}>Do not use at this time</Text>
          {verdict.notes.map((n, i) => (
            <Text key={i} style={styles.offNote}>
              • {n}
            </Text>
          ))}
          <Text style={styles.offModel}>Model suggestion (not to be applied):</Text>
        </View>
      ) : null}

      <View style={off ? styles.dimmed : undefined}>
        <View style={styles.tr}>
          <Text style={[styles.tdLabel, styles.th]}>Parameter</Text>
          <Text style={[styles.tdValue, styles.th]}>Value</Text>
        </View>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.tr, i % 2 === 1 && { backgroundColor: color + '12' }]}>
            <Text style={styles.tdLabel}>{r.label}</Text>
            <View style={styles.tdValueWrap}>
              <Text style={[styles.tdValueText, { color: off ? Colors.subText : color }]}>{r.value}</Text>
              {r.hint ? <Text style={styles.tdHint}>{r.hint}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      {!off && verdict.notes.length ? (
        <View style={styles.noteBox}>
          <Icon name="information-outline" size={16} color={Colors.warning} />
          <Text style={styles.noteText}>{verdict.notes.join(' · ')}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ───────────── styles ─────────────
const makeStyles = (Colors: AiColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  pred: {
    marginBottom: 14,
  },
  predTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  predTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.subText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  predRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  predLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  predPct: {
    fontSize: 15,
    fontWeight: '800',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  predNote: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.warning,
    lineHeight: 19,
  },
  device: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  deviceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  deviceTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  tr: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  thead: {
    backgroundColor: Colors.surfaceAlt,
  },
  trAlt: {
    backgroundColor: Colors.surfaceAlt,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.subText,
    textTransform: 'uppercase',
  },
  tdLabel: {
    width: 110,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.subText,
    fontWeight: '600',
  },
  tdValue: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  tdValueWrap: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  tdValueText: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  tdHint: {
    fontSize: 12,
    color: Colors.subText,
    marginTop: 1,
  },
  dimmed: {
    opacity: 0.45,
  },
  offBox: {
    backgroundColor: Colors.dangerSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  offTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.danger,
    marginBottom: 4,
  },
  offNote: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  offModel: {
    fontSize: 12,
    color: Colors.subText,
    marginTop: 8,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warningSoft,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  noteText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
});