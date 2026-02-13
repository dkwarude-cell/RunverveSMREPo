import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface Props {
  onFrameCapture?: (uri: string) => void;
}

/** Placeholder camera preview – swap in expo-camera CameraView when ready */
const CameraPreview: React.FC<Props> = ({ onFrameCapture }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📷</Text>
      <Text style={styles.label}>Camera Preview</Text>
      <Text style={styles.hint}>Grant camera permission to enable AI-guided placement</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', borderRadius: theme.borderRadius.lg, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  icon: { fontSize: 48 },
  label: { color: '#aaa', fontSize: 16, marginTop: 8 },
  hint: { color: '#666', fontSize: 12, marginTop: 4, paddingHorizontal: 24, textAlign: 'center' },
});

export default React.memo(CameraPreview);
