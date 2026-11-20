/**
 * Dock - full-width bottom tab bar with 5 tabs: white (black in dark mode) with a thin top divider;
 * the selected tab is red (filled icon + label + short indicator line on top). Hidden while the keyboard is open.
 */
import React, { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useTheme } from '../../theme';
import type { TabKey } from '../../navigation/types';
import { useTourTargets } from './AppTour';

export const TABS: { key: TabKey; label: string; icon: string; iconActive: string }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'analysis', label: 'AI Scan', icon: 'line-scan', iconActive: 'line-scan' },
  { key: 'device', label: 'Device', icon: 'bluetooth', iconActive: 'bluetooth-connect' },
  { key: 'stats', label: 'Stats', icon: 'chart-box-outline', iconActive: 'chart-box' },
  { key: 'assistant', label: 'Assistant', icon: 'message-processing-outline', iconActive: 'message-processing' },
];

const BAR_H = 62;

type Props = { active: TabKey; onChange: (t: TabKey) => void; deviceConnected?: boolean };

export default function Dock({ active, onChange, deviceConnected }: Props) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tourTargets = useTourTargets();

  // hide the dock while the keyboard is open (e.g. typing in the Assistant chat)
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (keyboardOpen) return null;

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom, backgroundColor: c.background, borderTopColor: c.divider }]}>
      {TABS.map(t => {
        const on = t.key === active;
        const color = on ? c.primary : c.textMuted;
        return (
          <Pressable key={t.key} ref={v => {
              tourTargets.set(`tab-${t.key}`, v);
            }} style={styles.item} onPress={() => onChange(t.key)}>
            <View style={[styles.indicator, { backgroundColor: on ? c.primary : 'transparent' }]} />
            <View>
              <Icon name={on ? t.iconActive : t.icon} size={24} color={color} />
              {t.key === 'device' && deviceConnected ? <View style={[styles.dot, { backgroundColor: c.success, borderColor: c.background }]} /> : null}
            </View>
            <Text style={[styles.label, { color }, on && styles.labelOn]} numberOfLines={1}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, elevation: 12, shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
  item: { flex: 1, height: BAR_H, alignItems: 'center', justifyContent: 'center' },
  indicator: { position: 'absolute', top: 0, width: 28, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  label: { fontFamily: fonts.medium, fontSize: 11, marginTop: 3, fontWeight: '500' },
  labelOn: { fontWeight: '700' },
  dot: { position: 'absolute', top: -1, right: -4, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
});
