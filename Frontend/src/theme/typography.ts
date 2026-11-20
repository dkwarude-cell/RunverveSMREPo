/**
 * typography.ts - text styles. Uses the phone's built-in fonts (Roboto on Android), nothing to install.
 * Clean, bold headings with plenty of white space (Uber-like).
 */
import { Platform, TextStyle } from 'react-native';

export const fonts = {
  regular: Platform.select({ android: 'sans-serif', default: 'System' }) as string,
  medium: Platform.select({ android: 'sans-serif-medium', default: 'System' }) as string,
  bold: Platform.select({ android: 'sans-serif', default: 'System' }) as string,
};

export const type: Record<string, TextStyle> = {
  hero: { fontFamily: fonts.bold, fontSize: 34, fontWeight: '800', letterSpacing: -0.8, lineHeight: 40 },
  h1: { fontFamily: fonts.bold, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, lineHeight: 34 },
  h2: { fontFamily: fonts.bold, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontFamily: fonts.medium, fontSize: 17, fontWeight: '600' },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, fontWeight: '600' },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  number: { fontFamily: fonts.bold, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
};
