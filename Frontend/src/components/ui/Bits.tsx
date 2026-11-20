/**
 * Bits.tsx - small shared building blocks.
 *   ScreenHeader  - back button + title row for pushed screens
 *   SectionHeader - section title with optional action text
 *   Chip          - selectable pill
 *   SegmentedTabs - segmented control (Week / Month ...)
 *   ListRow       - settings / menu row with icon, label, value, chevron or switch
 *   Pill          - small coloured label
 */
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Switch, Text, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts, radius, useTheme } from '../../theme';
import Touchable from './Touchable';
import { IconButton } from './Buttons';

export function ScreenHeader({ title, onBack, right }: { title?: string; onBack?: () => void; right?: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={styles.header}>
      {onBack ? <IconButton icon="arrow-left" onPress={onBack} size={42} /> : <View style={styles.headerSide} />}
      <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
        {title ?? ''}
      </Text>
      <View style={styles.headerSide}>{right}</View>
    </View>
  );
}

export function SectionHeader({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[styles.section, style]}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.sectionAction, { color: c.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: string }) {
  const { c } = useTheme();
  const fg = selected ? c.onInk : c.text;
  return (
    <Touchable onPress={onPress}>
      <View style={[styles.chip, { backgroundColor: selected ? c.ink : c.surface }]}>
        {icon ? <Icon name={icon} size={16} color={fg} style={styles.chipIcon} /> : null}
        <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
      </View>
    </Touchable>
  );
}

export function SegmentedTabs<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  const { c } = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: c.surface }]}>
      {options.map(o => {
        const on = o === value;
        return (
          <Pressable key={o} style={[styles.segItem, { backgroundColor: on ? c.ink : 'transparent' }]} onPress={() => onChange(o)}>
            <Text style={[styles.segText, { color: on ? c.onInk : c.textSecondary }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ListRow({
  icon,
  label,
  value,
  onPress,
  danger,
  toggle,
  onToggle,
  last,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  last?: boolean;
}) {
  const { c } = useTheme();
  const tint = danger ? c.danger : c.text;
  const body = (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.divider }]}>
      <Icon name={icon} size={21} color={danger ? c.danger : c.textSecondary} style={styles.rowIcon} />
      <Text style={[styles.rowLabel, { color: tint }]}>{label}</Text>
      {value ? (
        <Text style={[styles.rowValue, { color: c.textMuted }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {typeof toggle === 'boolean' ? (
        <Switch value={toggle} onValueChange={onToggle} trackColor={{ false: c.surfaceStrong, true: c.primary }} thumbColor="#FFFFFF" />
      ) : onPress ? (
        <Icon name="chevron-right" size={20} color={c.textMuted} />
      ) : null}
    </View>
  );
  return onPress ? <Touchable onPress={onPress}>{body}</Touchable> : body;
}

export function Pill({ text, color, icon }: { text: string; color?: string; icon?: string }) {
  const { c } = useTheme();
  const col = color ?? c.primary;
  return (
    <View style={[styles.pill, { backgroundColor: col + '1F' }]}>
      {icon ? <Icon name={icon} size={13} color={col} style={styles.pillIcon} /> : null}
      <Text style={[styles.pillText, { color: col }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  headerSide: { width: 42, alignItems: 'flex-end' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 17, fontWeight: '700', marginHorizontal: 8 },

  section: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  sectionAction: { fontFamily: fonts.medium, fontSize: 14, fontWeight: '600' },

  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, marginRight: 8, marginBottom: 8 },
  chipIcon: { marginRight: 6 },
  chipText: { fontFamily: fonts.medium, fontSize: 14, fontWeight: '600' },

  seg: { flexDirection: 'row', padding: 4, borderRadius: radius.pill },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.pill, overflow: 'hidden' },
  segText: { fontFamily: fonts.medium, fontSize: 14, fontWeight: '600' },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 8 },
  rowIcon: { marginRight: 14 },
  rowLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 14, marginRight: 6, maxWidth: '50%' },

  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillIcon: { marginRight: 4 },
  pillText: { fontFamily: fonts.medium, fontSize: 12, fontWeight: '700' },
});