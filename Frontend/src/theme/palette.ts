/**
 * palette.ts - the two colour themes.
 *   light: white app (#FFFFFF), black + red accents
 *   dark:  AMOLED black app (#000000), white + red accents
 * Every colour that gets an alpha suffix appended (e.g. color + '1A') must stay 6-digit hex.
 */

export type Palette = {
  dark: boolean;
  background: string; // screen
  surface: string; // cards, tiles, inputs
  surfaceStrong: string; // pressed / selected surface
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string; // brand red
  primarySoft: string; // light red tint
  onPrimary: string;
  ink: string; // black in light mode, white in dark mode (strong accents, dock)
  onInk: string;
  divider: string;
  overlay: string;
  gray: string; // neutral accent (charts)
  success: string;
  warning: string;
  danger: string;
  dock: string;
  dockIcon: string;
};

const RED = '#E11D2E';

export const lightPalette: Palette = {
  dark: false,
  background: '#FFFFFF',
  surface: '#F3F3F3',
  surfaceStrong: '#E8E8E8',
  text: '#000000',
  textSecondary: '#4B4B4B',
  textMuted: '#8A8A8A',
  primary: RED,
  primarySoft: '#FDECEE',
  onPrimary: '#FFFFFF',
  ink: '#000000',
  onInk: '#FFFFFF',
  divider: '#EAEAEA',
  overlay: 'rgba(0,0,0,0.5)',
  gray: '#9E9E9E',
  success: '#1F9D55',
  warning: '#D97706',
  danger: '#D92D20',
  dock: '#000000',
  dockIcon: '#A3A3A3',
};

export const darkPalette: Palette = {
  dark: true,
  background: '#000000',
  surface: '#141414',
  surfaceStrong: '#222222',
  text: '#FFFFFF',
  textSecondary: '#BDBDBD',
  textMuted: '#7A7A7A',
  primary: '#FF2D3D',
  primarySoft: '#2A0E11',
  onPrimary: '#FFFFFF',
  ink: '#FFFFFF',
  onInk: '#000000',
  divider: '#1F1F1F',
  overlay: 'rgba(0,0,0,0.7)',
  gray: '#6E6E6E',
  success: '#32D74B',
  warning: '#FF9F0A',
  danger: '#FF453A',
  dock: '#141414',
  dockIcon: '#8A8A8A',
};

/**
 * Colour names used by the AI scan module (kept from the original module so its code stays the same).
 */
export function aiColors(p: Palette) {
  return {
    primary: p.primary,
    primaryDark: p.primary,
    primarySoft: p.primarySoft,
    background: p.background,
    surface: p.surface,
    surfaceAlt: p.background,
    text: p.text,
    subText: p.textSecondary,
    muted: p.textMuted,
    border: p.divider,
    shadow: '#000000',

    success: p.success,
    successSoft: p.dark ? '#0F2416' : '#E7F6EC',
    warning: p.warning,
    warningSoft: p.dark ? '#2A1D07' : '#FEF3E2',
    danger: p.danger,
    dangerSoft: p.dark ? '#2A0E0C' : '#FDECEC',
    info: p.ink,
    infoSoft: p.surfaceStrong,

    mild: p.success,
    moderate: p.warning,
    severe: p.danger,

    // therapy tables in the AI report: orange / green / blue
    heat: p.dark ? '#FB923C' : '#EA580C',
    vibration: p.dark ? '#4ADE80' : '#16A34A',
    tens: p.dark ? '#60A5FA' : '#2563EB',
  };
}

export type AiColors = ReturnType<typeof aiColors>;