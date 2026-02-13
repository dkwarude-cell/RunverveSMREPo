import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../styles/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  elevation?: number;
  style?: ViewStyle;
  testID?: string;
}

const Card: React.FC<CardProps> = ({ children, onPress, style, testID }) => {
  const content = (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
});

export default React.memo(Card);
