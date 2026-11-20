/**
 * AppText - Text with the app's type presets and theme colours.
 *   <AppText variant="h2">Title</AppText>
 *   <AppText variant="body" tone="secondary">...</AppText>
 */
import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { type, useTheme } from '../../theme';

type Variant = 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'caption' | 'number';
type Tone = 'primary' | 'secondary' | 'muted' | 'red' | 'onInk' | 'white';

type Props = TextProps & { variant?: Variant; tone?: Tone; style?: StyleProp<TextStyle>; center?: boolean };

export default function AppText({ variant = 'body', tone = 'primary', style, center, ...rest }: Props) {
  const { c } = useTheme();
  const color = {
    primary: c.text,
    secondary: c.textSecondary,
    muted: c.textMuted,
    red: c.primary,
    onInk: c.onInk,
    white: '#FFFFFF',
  }[tone];
  return <Text {...rest} style={[{ color }, type[variant], center ? { textAlign: 'center' } : null, style]} />;
}
