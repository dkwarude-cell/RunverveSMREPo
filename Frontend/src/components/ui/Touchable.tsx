/**
 * Touchable - Pressable with a light opacity dip when pressed (cheap, smooth on low-end phones).
 */
import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; children: React.ReactNode };

export default function Touchable({ style, disabled, children, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [style, disabled ? { opacity: 0.45 } : pressed ? { opacity: 0.7 } : null]}
    >
      {children}
    </Pressable>
  );
}
