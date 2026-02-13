import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../../styles/theme';

interface Props {
  uri?: string | null;
  size?: number;
  onPress?: () => void;
  editable?: boolean;
}

const AvatarUpload: React.FC<Props> = ({ uri, size = 80, onPress, editable = false }) => (
  <TouchableOpacity onPress={onPress} disabled={!editable} style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
    {uri ? (
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
    ) : (
      <Text style={[styles.placeholder, { fontSize: size * 0.4 }]}>👤</Text>
    )}
    {editable && (
      <View style={styles.editBadge}>
        <Text style={styles.editIcon}>📷</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  placeholder: {},
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.primary, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  editIcon: { fontSize: 12 },
});

export default React.memo(AvatarUpload);
