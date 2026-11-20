/**
 * OtpInput - six digit boxes with auto-advance, paste support and backspace-to-previous.
 */
import React, { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { fonts, radius, useTheme } from '../../theme';

type Props = { value: string[]; onChange: (next: string[]) => void; editable?: boolean };

export default function OtpInput({ value, onChange, editable = true }: Props) {
  const { c } = useTheme();
  const refs = useRef<Array<TextInput | null>>([]);

  const change = (text: string, index: number) => {
    const digits = text.replace(/\D/g, '');
    const next = [...value];
    if (digits.length > 1) {
      digits
        .slice(0, 6)
        .split('')
        .forEach((d, i) => {
          next[i] = d;
        });
      onChange(next);
      refs.current[Math.min(digits.length, 6) - 1]?.focus();
      return;
    }
    next[index] = digits.slice(-1);
    onChange(next);
    if (digits && index < 5) refs.current[index + 1]?.focus();
  };

  return (
    <View style={styles.row}>
      {value.map((digit, index) => (
        <TextInput
          key={index}
          ref={r => {
            refs.current[index] = r;
          }}
          style={[styles.box, { backgroundColor: digit ? c.primarySoft : c.surface, color: c.text }]}
          value={digit}
          keyboardType="number-pad"
          maxLength={index === 0 ? 6 : 1}
          onChangeText={t => change(t, index)}
          onKeyPress={e => {
            if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) refs.current[index - 1]?.focus();
          }}
          autoFocus={index === 0}
          editable={editable}
          selectionColor={c.primary}
          textContentType="oneTimeCode"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 22 },
  box: { width: 48, height: 56, borderRadius: radius.md, fontFamily: fonts.bold, fontSize: 22, fontWeight: '700', textAlign: 'center' },
});
