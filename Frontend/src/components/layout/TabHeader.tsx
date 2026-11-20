/**
 * TabHeader - top of every dock tab: menu button, big title, profile avatar.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../ui/AppText';
import Avatar from '../ui/Avatar';
import { IconButton } from '../ui/Buttons';
import Touchable from '../ui/Touchable';
import { useMainNav } from './MainNavContext';
import { useUser } from '../../context/UserContext';

type Props = { title: string; subtitle?: string; kicker?: string };

export default function TabHeader({ title, subtitle, kicker }: Props) {
  const { openMenu, openProfile } = useMainNav();
  const { displayName } = useUser();

  return (
    <View>
      <View style={styles.bar}>
        <IconButton icon="menu" onPress={openMenu} size={42} />
        <Touchable onPress={openProfile}>
          <Avatar name={displayName} size={42} />
        </Touchable>
      </View>
      {kicker ? (
        <AppText variant="caption" tone="muted" style={styles.kicker}>
          {kicker}
        </AppText>
      ) : null}
      <AppText variant="h1">{title}</AppText>
      {subtitle ? (
        <AppText variant="body" tone="secondary" style={styles.sub}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  kicker: { marginBottom: 4 },
  sub: { marginTop: 4 },
});
