/**
 * FormControls.tsx - small input widgets used on the Home screen.
 *  FormCard      : white card with an icon title
 *  NumberField   : number input with - / + buttons
 *  ChipSelector  : pick one number from a range (e.g. pain 1-10)
 *  Segmented     : pick one of two/three options (e.g. Yes / No)
 *  CheckRow      : tick box with a label
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme';
import type { AiColors } from '../../theme';

// ───────────── FormCard ─────────────
export function FormCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  const { ai: Colors } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Icon name={icon} size={20} color={Colors.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ───────────── NumberField ─────────────
interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  decimals?: number;
  hint?: string;
}

export function NumberField({ label, value, onChange, min, max, step = 1, unit, decimals = 0, hint }: NumberFieldProps) {
  const { ai: Colors } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [text, setText] = useState(String(value));

  // keep the text box in sync when the value changes from outside (e.g. +/- or auto-estimate)
  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const clamp = (v: number) => {
    const c = Math.min(max, Math.max(min, v));
    const f = Math.pow(10, decimals);
    return Math.round(c * f) / f;
  };

  const commit = () => {
    const n = parseFloat(text.replace(',', '.'));
    const v = isNaN(n) ? value : clamp(n);
    setText(String(v));
    onChange(v);
  };

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.range}>
          {min}–{max}
          {unit ? ` ${unit}` : ''}
        </Text>
      </View>
      <View style={styles.numberRow}>
        <Pressable style={styles.stepBtn} onPress={() => onChange(clamp(value - step))} hitSlop={6}>
          <Icon name="minus" size={20} color={Colors.primary} />
        </Pressable>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            onEndEditing={commit}
            onBlur={commit}
            keyboardType="numeric"
            returnKeyType="done"
            selectTextOnFocus
          />
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>
        <Pressable style={styles.stepBtn} onPress={() => onChange(clamp(value + step))} hitSlop={6}>
          <Icon name="plus" size={20} color={Colors.primary} />
        </Pressable>
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

// ───────────── ChipSelector ─────────────
interface ChipSelectorProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  lowText?: string;
  highText?: string;
}

function chipColor(Colors: AiColors, v: number, min: number, max: number): string {
  const r = (v - min) / Math.max(1, max - min);
  if (r < 0.34) return Colors.success;
  if (r < 0.67) return Colors.moderate;
  return Colors.danger;
}

export function ChipSelector({ label, value, onChange, min, max, lowText, highText }: ChipSelectorProps) {
  const { ai: Colors } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const values: number[] = [];
  for (let v = min; v <= max; v++) values.push(v);
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.valueBadge, { color: chipColor(Colors, value, min, max) }]}>
          {value}/{max}
        </Text>
      </View>
      <View style={styles.chipRow}>
        {values.map(v => {
          const active = v === value;
          return (
            <Pressable
              key={v}
              onPress={() => onChange(v)}
              style={[styles.chip, active && { backgroundColor: chipColor(Colors, v, min, max) }]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{v}</Text>
            </Pressable>
          );
        })}
      </View>
      {lowText || highText ? (
        <View style={styles.scaleRow}>
          <Text style={styles.scaleText}>{lowText}</Text>
          <Text style={styles.scaleText}>{highText}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ───────────── Segmented ─────────────
interface SegmentedProps<T extends string> {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  hint?: string;
}

export function Segmented<T extends string>({ label, options, value, onChange, hint }: SegmentedProps<T>) {
  const { ai: Colors } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segment}>
        {options.map(o => {
          const active = o === value;
          return (
            <Pressable key={o} onPress={() => onChange(o)} style={[styles.segmentItem, active && styles.segmentActive]}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

// ───────────── CheckRow ─────────────
export function CheckRow({ label, sub, checked, onToggle }: { label: string; sub?: string; checked: boolean; onToggle: () => void }) {
  const { ai: Colors } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  return (
    <Pressable style={styles.checkRow} onPress={onToggle}>
      <Icon
        name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
        size={24}
        color={checked ? Colors.primary : Colors.muted}
      />
      <View style={styles.checkTextWrap}>
        <Text style={styles.checkLabel}>{label}</Text>
        {sub ? <Text style={styles.checkSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

// ───────────── styles ─────────────
const makeStyles = (Colors: AiColors) =>
  StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  field: {
    marginTop: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  range: {
    fontSize: 12,
    color: Colors.muted,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    height: 44,
    marginHorizontal: 10,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minWidth: 60,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    paddingVertical: 0,
  },
  unit: {
    fontSize: 14,
    color: Colors.subText,
    marginLeft: 2,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.subText,
  },
  valueBadge: {
    fontSize: 14,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    marginHorizontal: -2,
  },
  chip: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.subText,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  scaleText: {
    fontSize: 11,
    color: Colors.muted,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 3,
    marginTop: 6,
  },
  segmentItem: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.subText,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  checkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  checkSub: {
    fontSize: 12,
    color: Colors.subText,
    marginTop: 1,
  },
});
