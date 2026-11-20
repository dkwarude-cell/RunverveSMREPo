/**
 * AnalyzeButton - the main "Analyze" call to action of the AI scan.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { PrimaryButton } from '../ui/Buttons';

interface Props {
  disabled?: boolean;
  label?: string;
  onPress: () => void;
}

export default function AnalyzeButton({ disabled = false, label = 'Analyze', onPress }: Props) {
  return <PrimaryButton title={label} icon="brain" onPress={onPress} disabled={disabled} style={styles.button} />;
}

const styles = StyleSheet.create({
  button: { marginTop: 22 },
});
