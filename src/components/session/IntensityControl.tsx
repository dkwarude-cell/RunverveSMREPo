import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';
import { clamp } from '../../utils/helpers';
import { MAX_INTENSITY_LEVEL, MIN_INTENSITY_LEVEL } from '../../utils/constants';

interface Props {
  intensity: number;
  onChange: (level: number) => void;
  disabled?: boolean;
}

const IntensityControl: React.FC<Props> = ({ intensity, onChange, disabled = false }) => {
  const decrease = () => onChange(clamp(intensity - 1, MIN_INTENSITY_LEVEL, MAX_INTENSITY_LEVEL));
  const increase = () => onChange(clamp(intensity + 1, MIN_INTENSITY_LEVEL, MAX_INTENSITY_LEVEL));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Intensity</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={decrease} disabled={disabled || intensity <= MIN_INTENSITY_LEVEL}>
          <Text style={styles.buttonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.value}>{intensity}</Text>
        <TouchableOpacity style={styles.button} onPress={increase} disabled={disabled || intensity >= MAX_INTENSITY_LEVEL}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: theme.spacing.md },
  label: { ...theme.typography.caption, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm },
  controls: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  value: { fontSize: 32, fontWeight: 'bold', color: theme.colors.text.primary, minWidth: 40, textAlign: 'center' },
});

export default React.memo(IntensityControl);
