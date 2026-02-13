import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';

interface Props {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: { icon: string; onPress: () => void };
}

const Header: React.FC<Props> = ({ title, showBack, onBack, rightAction }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={styles.btn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        ) : <View style={styles.btn} />}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {rightAction ? (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.btn}>
            <Text style={styles.rightIcon}>{rightAction.icon}</Text>
          </TouchableOpacity>
        ) : <View style={styles.btn} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, paddingBottom: 10, paddingHorizontal: theme.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { width: 40, alignItems: 'center' },
  backIcon: { fontSize: 32, color: theme.colors.primary, marginTop: -4 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: theme.colors.text.primary },
  rightIcon: { fontSize: 20 },
});

export default React.memo(Header);
