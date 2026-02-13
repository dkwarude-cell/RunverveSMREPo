import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
  fullScreen = false,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  message: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});

export default LoadingSpinner;
