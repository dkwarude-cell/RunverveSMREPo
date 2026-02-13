import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  KeyboardTypeOptions,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../styles/theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
}

const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
  testID,
  accessibilityLabel,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error ? styles.errorBorder : null,
          !editable && styles.disabledContainer,
        ]}
      >
        <TextInput
          style={[styles.input, multiline && { height: numberOfLines * 24, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.disabled}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
          accessibilityLabel={accessibilityLabel || label || placeholder}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  focused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  errorBorder: {
    borderColor: theme.colors.error,
  },
  disabledContainer: {
    backgroundColor: '#F3F4F6',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  eyeButton: {
    paddingHorizontal: theme.spacing.sm,
  },
  eyeIcon: {
    fontSize: 18,
  },
});

export default React.memo(Input);
