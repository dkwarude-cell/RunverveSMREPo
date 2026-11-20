/**
 * Card - flat surface block (no border, no gradient). Tap-able when onPress is given.
 */
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { radius, useTheme } from '../../theme';
import Touchable from './Touchable';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  tint?: string; // optional background override (e.g. c.primarySoft for a selected card)
  onPress?: () => void;
};

export default function Card({ children, style, padding = 16, tint, onPress }: Props) {
  const { c } = useTheme();
  const box = <View style={[{ backgroundColor: tint ?? c.surface, borderRadius: radius.lg, padding }, style]}>{children}</View>;
  return onPress ? <Touchable onPress={onPress}>{box}</Touchable> : box;
}
