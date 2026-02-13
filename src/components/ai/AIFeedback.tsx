import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../styles/theme';

interface Props {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  visible?: boolean;
}

const COLORS: Record<string, string> = {
  info: theme.colors.secondary,
  success: theme.colors.success,
  warning: theme.colors.warning,
  error: theme.colors.error,
};

const AIFeedback: React.FC<Props> = ({ message, type = 'info', visible = true }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 250, useNativeDriver: true }).start();
  }, [visible]);

  const bg = COLORS[type] || COLORS.info;

  return (
    <Animated.View style={[styles.container, { backgroundColor: bg, opacity }]} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  text: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default React.memo(AIFeedback);
