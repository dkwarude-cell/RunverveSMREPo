/**
 * SideMenu - hamburger menu panel from the left: profile, shortcuts, account, logout.
 */
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppText from '../ui/AppText';
import Avatar from '../ui/Avatar';
import Logo from '../ui/Logo';
import Touchable from '../ui/Touchable';
import { fonts, radius, useTheme } from '../../theme';
import { useUser } from '../../context/UserContext';
import type { TabKey } from '../../navigation/types';

export type MenuAction = 'profile' | 'settings' | 'about' | 'help' | 'privacy' | 'logout' | { tab: TabKey };

type Props = { visible: boolean; onClose: () => void; onSelect: (a: MenuAction) => void; activeTab: TabKey };

const SHORTCUTS: { label: string; icon: string; tab: TabKey }[] = [
  { label: 'Home', icon: 'home-outline', tab: 'home' },
  { label: 'AI Injury Scan', icon: 'line-scan', tab: 'analysis' },
  { label: 'My Device', icon: 'bluetooth-connect', tab: 'device' },
  { label: 'Activity & Stats', icon: 'chart-box-outline', tab: 'stats' },
  { label: 'AI Assistant', icon: 'message-processing-outline', tab: 'assistant' },
];

const ACCOUNT: { label: string; icon: string; action: MenuAction }[] = [
  { label: 'My Profile', icon: 'account-circle-outline', action: 'profile' },
  { label: 'Settings', icon: 'cog-outline', action: 'settings' },
  { label: 'Help & Support', icon: 'lifebuoy', action: 'help' },
  { label: 'Privacy & Terms', icon: 'shield-lock-outline', action: 'privacy' },
  { label: 'About SmartHeal', icon: 'information-outline', action: 'about' },
];

export default function SideMenu({ visible, onClose, onSelect, activeTab }: Props) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { displayName, user } = useUser();
  const panelW = Math.min(width * 0.84, 340);

  const Row = ({ label, icon, onPress, active, danger }: { label: string; icon: string; onPress: () => void; active?: boolean; danger?: boolean }) => (
    <Touchable onPress={onPress}>
      <View style={[styles.row, { backgroundColor: active ? c.surface : 'transparent' }]}>
        <Icon name={icon} size={22} color={danger ? c.danger : active ? c.primary : c.textSecondary} />
        <AppText style={[styles.rowText, { color: danger ? c.danger : c.text }, active && styles.rowTextActive]}>{label}</AppText>
      </View>
    </Touchable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} onPress={onClose} />
      <View style={[styles.panel, { width: panelW, backgroundColor: c.background, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.brandRow}>
          <Logo size={26} withName />
          <Pressable onPress={onClose} hitSlop={12} style={[styles.close, { backgroundColor: c.surface }]}>
            <Icon name="close" size={20} color={c.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Touchable onPress={() => onSelect('profile')}>
            <View style={[styles.profile, { backgroundColor: c.surface }]}>
              <Avatar name={displayName} size={48} />
              <View style={styles.profileText}>
                <AppText style={styles.name} numberOfLines={1}>
                  {displayName}
                </AppText>
                <AppText variant="small" tone="muted" numberOfLines={1}>
                  {user?.email ?? ''}
                </AppText>
              </View>
              <Icon name="chevron-right" size={20} color={c.textMuted} />
            </View>
          </Touchable>

          <AppText variant="caption" tone="muted" style={styles.group}>
            NAVIGATE
          </AppText>
          {SHORTCUTS.map(s => (
            <Row key={s.tab} label={s.label} icon={s.icon} active={activeTab === s.tab} onPress={() => onSelect({ tab: s.tab })} />
          ))}

          <AppText variant="caption" tone="muted" style={styles.group}>
            ACCOUNT
          </AppText>
          {ACCOUNT.map(a => (
            <Row key={a.label} label={a.label} icon={a.icon} onPress={() => onSelect(a.action)} />
          ))}
        </ScrollView>

        <View style={[styles.line, { backgroundColor: c.divider }]} />
        <Row label="Log out" icon="logout" danger onPress={() => onSelect('logout')} />
        <AppText variant="small" tone="muted" style={styles.version}>
          SmartHeal v1.0.0 · Runverve
        </AppText>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0, paddingHorizontal: 16, borderTopRightRadius: radius.xl, borderBottomRightRadius: radius.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  profile: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.lg },
  profileText: { flex: 1, marginLeft: 12 },
  name: { fontFamily: fonts.medium, fontWeight: '700', fontSize: 16 },
  group: { marginTop: 22, marginBottom: 6, marginLeft: 12, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.md, overflow: 'hidden' },
  rowText: { marginLeft: 14, fontFamily: fonts.medium, fontSize: 15, flex: 1 },
  rowTextActive: { fontWeight: '700' },
  line: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  version: { marginTop: 8, marginLeft: 12 },
});