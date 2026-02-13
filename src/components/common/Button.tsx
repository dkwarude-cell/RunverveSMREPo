import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../styles/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}) => {
  const containerStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const labelStyles = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
    disabled && styles.labelDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? theme.colors.primary : '#fff'}
          size="small"
        />
      ) : (
        <Text style={labelStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  text: {
    backgroundColor: 'transparent',
  },
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  size_md: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  size_lg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '600',
  },
  label_primary: {
    color: theme.colors.text.inverse,
  },
  label_secondary: {
    color: theme.colors.text.inverse,
  },
  label_outline: {
    color: theme.colors.primary,
  },
  label_text: {
    color: theme.colors.primary,
  },
  labelSize_sm: {
    fontSize: 14,
  },
  labelSize_md: {
    fontSize: 16,
  },
  labelSize_lg: {
    fontSize: 18,
  },
  labelDisabled: {
    color: theme.colors.text.disabled,
  },
});

export default React.memo(Button);
