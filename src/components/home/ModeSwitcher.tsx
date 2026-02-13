import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';

interface Props {
  mode: 'pro' | 'guided';
  onToggle: (mode: 'pro' | 'guided') => void;
}

const ModeSwitcher: React.FC<Props> = ({ mode, onToggle }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.option, mode === 'guided' && styles.activeGuided]}
        onPress={() => onToggle('guided')}
      >
        <Text style={[styles.label, mode === 'guided' && styles.activeLabel]}>Guided</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, mode === 'pro' && styles.activePro]}
        onPress={() => onToggle('pro')}
      >
        <Text style={[styles.label, mode === 'pro' && styles.activeLabel]}>Pro</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
  },
  activeGuided: { backgroundColor: theme.colors.mode.guided },
  activePro: { backgroundColor: theme.colors.mode.pro },
  label: { fontWeight: '600', color: theme.colors.text.secondary },
  activeLabel: { color: '#FFFFFF' },
});

export default React.memo(ModeSwitcher);
