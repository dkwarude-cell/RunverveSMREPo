/**
 * TextField - filled grey input with optional icon and show/hide for passwords. No borders.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts, radius, useTheme } from '../../theme';

type Props = TextInputProps & { label?: string; icon?: string; password?: boolean; hint?: string };

export default function TextField({ label, icon, password, hint, style, ...rest }: Props) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.field, { backgroundColor: focused ? c.surfaceStrong : c.surface }]}>
        {icon ? <Icon name={icon} size={20} color={focused ? c.primary : c.textMuted} style={styles.icon} /> : null}
        <TextInput
          placeholderTextColor={c.textMuted}
          selectionColor={c.primary}
          cursorColor={c.primary}
          {...rest}
          secureTextEntry={password ? hidden : rest.secureTextEntry}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, { color: c.text }, style]}
        />
        {password ? (
          <Pressable onPress={() => setHidden(h => !h)} hitSlop={10} style={styles.eye}>
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={c.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={[styles.hint, { color: c.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontFamily: fonts.medium, fontSize: 13, fontWeight: '600', marginBottom: 7 },
  field: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: radius.md, paddingHorizontal: 14 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15.5, paddingVertical: 0 },
  eye: { paddingLeft: 8 },
  hint: { fontSize: 12, marginTop: 6 },
});
