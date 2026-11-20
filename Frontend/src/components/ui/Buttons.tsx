/**
 * Buttons.tsx - flat buttons, no borders, no gradients.
 *   PrimaryButton   - solid red (main action)
 *   SecondaryButton - solid grey surface
 *   TextButton      - text only
 *   IconButton      - round grey icon button
 */
import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts, radius, useTheme } from '../../theme';
import Touchable from './Touchable';

type BtnProps = {
  title: string;
  onPress?: () => void;
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

function BaseButton({ bg, fg, title, onPress, icon, iconRight, loading, disabled, style, compact }: BtnProps & { bg: string; fg: string }) {
  return (
    <Touchable onPress={onPress} disabled={disabled || loading} style={style}>
      <View style={[styles.base, compact && styles.compact, { backgroundColor: bg }]}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {icon ? <Icon name={icon} size={20} color={fg} style={styles.iconLeft} /> : null}
            <Text style={[styles.text, { color: fg }]}>{title}</Text>
            {iconRight ? <Icon name={iconRight} size={20} color={fg} style={styles.iconRight} /> : null}
          </>
        )}
      </View>
    </Touchable>
  );
}

export function PrimaryButton(p: BtnProps) {
  const { c } = useTheme();
  return <BaseButton {...p} bg={c.primary} fg={c.onPrimary} />;
}

export function SecondaryButton(p: BtnProps) {
  const { c } = useTheme();
  return <BaseButton {...p} bg={c.surface} fg={c.text} />;
}

/** black button in light mode / white in dark mode */
export function InkButton(p: BtnProps) {
  const { c } = useTheme();
  return <BaseButton {...p} bg={c.ink} fg={c.onInk} />;
}

export function TextButton({ title, onPress, tone = 'red', style }: { title: string; onPress?: () => void; tone?: 'red' | 'muted'; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <Touchable onPress={onPress} style={[styles.textBtn, style]}>
      <Text style={[styles.textBtnText, { color: tone === 'red' ? c.primary : c.textSecondary }]}>{title}</Text>
    </Touchable>
  );
}

export function IconButton({ icon, onPress, size = 44, style }: { icon: string; onPress?: () => void; size?: number; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <Touchable onPress={onPress} style={style}>
      <View style={[styles.iconBtn, { width: size, height: size, borderRadius: size / 2, backgroundColor: c.surface }]}>
        <Icon name={icon} size={size * 0.5} color={c.text} />
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  compact: { height: 44, paddingHorizontal: 16 },
  text: { fontFamily: fonts.medium, fontSize: 16, fontWeight: '600' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 6 },
  textBtn: { paddingVertical: 10, paddingHorizontal: 8, alignSelf: 'center' },
  textBtnText: { fontFamily: fonts.medium, fontSize: 14.5, fontWeight: '600' },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
});
