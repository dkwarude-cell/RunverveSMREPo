import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { theme } from '../../styles/theme';
import { RootState } from '../../store';
import { useAuth } from '../../store/hooks/useAuth';

const MENU_ITEMS = [
  { label: 'Home', icon: '🏠', screen: 'HomeTab' },
  { label: 'Devices', icon: '🩹', screen: 'DevicesTab' },
  { label: 'History', icon: '📊', screen: 'HistoryTab' },
  { label: 'Profile', icon: '👤', screen: 'ProfileTab' },
  { label: 'Settings', icon: '⚙️', screen: 'Settings' },
  { label: 'Help', icon: '❓', screen: 'Help' },
];

const DrawerContent: React.FC<any> = (props) => {
  const profile = useSelector((s: RootState) => s.user.profile);
  const { logout } = useAuth();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(profile?.displayName?.[0] || '?').toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{profile?.displayName || 'SmartHeal User'}</Text>
        <Text style={styles.type}>{profile?.profileType || 'Runner'}</Text>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {MENU_ITEMS.map(item => (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => props.navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOut} onPress={logout}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: theme.spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  name: { fontSize: 17, fontWeight: '600', color: theme.colors.text.primary, marginTop: 8 },
  type: { fontSize: 13, color: theme.colors.primary, marginTop: 2, textTransform: 'capitalize' },
  menu: { paddingTop: theme.spacing.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: theme.spacing.lg },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuLabel: { fontSize: 15, color: theme.colors.text.primary },
  signOut: { marginTop: 'auto', padding: theme.spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  signOutText: { fontSize: 15, color: theme.colors.error, fontWeight: '500' },
});

export default DrawerContent;
