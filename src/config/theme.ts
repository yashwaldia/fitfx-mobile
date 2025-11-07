import { AURORA_GRADIENT, NEUMORPHIC, GLASS, SUBSCRIPTION_COLORS, ICON_GRID } from './colors';

// ✅ Complete Theme System
export const THEME = {
  colors: {
    aurora: AURORA_GRADIENT,
    neumorphic: NEUMORPHIC,
    glass: GLASS,
    subscription: SUBSCRIPTION_COLORS,
    iconGrid: ICON_GRID,
  },
  
  // ✅ Shadow styles for glassmorphism
  shadows: {
    glassSmall: {
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    glassMedium: {
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    glassLarge: {
      elevation: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
  },
  
  // ✅ Border radius (modern rounded)
  radius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
    full: 999,
  },
  
  // ✅ Spacing (consistent padding/margin)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  
  // ✅ Typography
  typography: {
    heading1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    heading2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    heading3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
  },
};

export type Theme = typeof THEME;
