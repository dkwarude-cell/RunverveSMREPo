import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { theme } from '../../styles/theme';
import { RootState } from '../../store';
import { useAuth } from '../../store/hooks/useAuth';
import AvatarUpload from '../../components/profile/AvatarUpload';
import StatCard from '../../components/profile/StatCard';
import Button from '../../components/common/Button';

interface Props { navigation: any }

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const profile = useSelector((s: RootState) => s.user.profile);
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <AvatarUpload uri={profile?.photoURL} size={80} editable onPress={() => {}} />
        <Text style={styles.name}>{profile?.displayName || user?.email || 'User'}</Text>
        <Text style={styles.type}>{profile?.profileType?.toUpperCase() || 'RUNNER'}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Sessions" value={profile?.totalSessions ?? 0} icon="🎯" />
        <StatCard label="Streak" value={`${profile?.streak ?? 0}d`} icon="🔥" />
        <StatCard label="Level" value={profile?.level ?? 1} icon="⭐" />
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        <MenuItem label="Achievements" icon="🏆" onPress={() => navigation.navigate('Achievements')} />
        <MenuItem label="Goals" icon="🎯" onPress={() => navigation.navigate('Goals')} />
        <MenuItem label="Settings" icon="⚙️" onPress={() => navigation.navigate('Settings')} />
        <MenuItem label="Help & FAQ" icon="❓" onPress={() => navigation.navigate('Help')} />
        <MenuItem label="About" icon="ℹ️" onPress={() => navigation.navigate('About')} />
      </View>

      <Button title="Sign Out" variant="outline" onPress={logout} style={styles.signOutBtn} />
    </ScrollView>
  );
};

const MenuItem: React.FC<{ label: string; icon: string; onPress: () => void }> = ({ label, icon, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <Text style={styles.menuLabel}>{label}</Text>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg },
  header: { alignItems: 'center', marginBottom: theme.spacing.lg },
  name: { fontSize: 22, fontWeight: '700', color: theme.colors.text.primary, marginTop: theme.spacing.sm },
  type: { fontSize: 13, fontWeight: '600', color: theme.colors.primary, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  menu: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, overflow: 'hidden', ...theme.shadows.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: theme.spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: theme.colors.text.primary },
  chevron: { fontSize: 22, color: theme.colors.text.disabled },
  signOutBtn: { marginTop: theme.spacing.xl, borderColor: theme.colors.error },
});

export default ProfileScreen;
