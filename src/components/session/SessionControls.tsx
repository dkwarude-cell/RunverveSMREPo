import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import Button from '../common/Button';
import { SessionState } from '../../models/Session';

interface Props {
  state: SessionState;
  onStart?: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const SessionControls: React.FC<Props> = ({ state, onStart, onPause, onResume, onStop }) => {
  return (
    <View style={styles.container}>
      {state === 'idle' && onStart && (
        <Button title="Start Session" onPress={onStart} size="lg" style={styles.fullWidth} />
      )}
      {state === 'active' && (
        <View style={styles.row}>
          <Button title="Pause" onPress={onPause} variant="outline" size="lg" style={styles.halfButton} />
          <Button title="Stop" onPress={onStop} variant="secondary" size="lg" style={styles.halfButton} />
        </View>
      )}
      {state === 'paused' && (
        <View style={styles.row}>
          <Button title="Resume" onPress={onResume} size="lg" style={styles.halfButton} />
          <Button title="Stop" onPress={onStop} variant="secondary" size="lg" style={styles.halfButton} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: theme.spacing.lg },
  row: { flexDirection: 'row', gap: theme.spacing.md },
  halfButton: { flex: 1 },
  fullWidth: { width: '100%' },
});

export default React.memo(SessionControls);
