/**
 * Logo - the SmartHeal mark (src/assets/images/smartheal-logo.png) drawn in solid brand red,
 * optionally with the wordmark.
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../../theme';

export const LOGO = require('../../assets/images/smartheal-logo.png');

type Props = { size?: number; withName?: boolean; tagline?: boolean };

export default function Logo({ size = 40, withName, tagline }: Props) {
  const { c } = useTheme();
  return (
    <View style={styles.row}>
      <Image source={LOGO} style={{ width: size, height: size * 1.22, tintColor: c.primary }} resizeMode="contain" />
      {withName ? (
        <View style={styles.textBox}>
          <Text style={[styles.name, { fontSize: Math.max(18, size * 0.5), color: c.text }]}>SmartHeal</Text>
          {tagline ? <Text style={[styles.tagline, { color: c.textMuted }]}>by Runverve</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  textBox: { marginLeft: 10 },
  name: { fontFamily: fonts.bold, fontWeight: '800', letterSpacing: -0.4 },
  tagline: { fontSize: 12, marginTop: -1 },
});
