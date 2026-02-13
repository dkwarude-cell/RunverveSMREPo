import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';

interface Tab {
  key: string;
  label: string;
  icon: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

const BottomTabBar: React.FC<Props> = ({ tabs, activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map(tab => {
        const active = tab.key === activeTab;
        return (
          <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onTabPress(tab.key)}>
            <Text style={[styles.icon, active && styles.activeIcon]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center' },
  icon: { fontSize: 22 },
  activeIcon: { },
  label: { fontSize: 11, color: theme.colors.text.disabled, marginTop: 2 },
  activeLabel: { color: theme.colors.primary, fontWeight: '600' },
});

export default React.memo(BottomTabBar);
