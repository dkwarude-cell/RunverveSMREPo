export { lightPalette, darkPalette, aiColors } from './palette';
export type { Palette, AiColors } from './palette';
export { useTheme, useStyles } from './ThemeContext';
export { fonts, type } from './typography';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

// space reserved at the bottom of tab screens so content scrolls above the dock
export const DOCK_SPACE = 84;
