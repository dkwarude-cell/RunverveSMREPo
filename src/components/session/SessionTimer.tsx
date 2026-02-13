import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { formatDuration } from '../../utils/formatters';

interface Props {
  timeRemaining: number;
  isActive: boolean;
}

const SessionTimer: React.FC<Props> = ({ timeRemaining, isActive }) => {
  const color = timeRemaining < 60 ? theme.colors.error : theme.colors.text.primary;

  return (
    <Text style={[styles.timer, { color }]} accessibilityLabel={`Time remaining: ${formatDuration(timeRemaining)}`}>
      {formatDuration(timeRemaining)}
    </Text>
  );
};

const styles = StyleSheet.create({
  timer: {
    fontSize: 56,
    fontWeight: 'bold',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});

export default React.memo(SessionTimer);
