export const AURORA_GRADIENT = {
  cyan: '#00D9FF',
  pink: '#FF006E',
  orange: '#FFA500',
  purple: '#B300FF',
};

export const NEUMORPHIC = {
  bg: '#0A0E27',
  bgLight: '#1A1F3A',
  bgDark: '#141619',        // ✅ ADD THIS LINE
  bgDarker: '#050810',
  textPrimary: '#FFFFFF',
  textSecondary: '#D8E1F0',
  textTertiary: '#B5C4D8',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderDark: 'rgba(0, 0, 0, 0.3)',
};

export const THEME = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
  },
  typography: {
    heading1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    heading2: {
      fontSize: 26,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    heading3: {
      fontSize: 18,
      fontWeight: '700' as const,
      lineHeight: 26,
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 22,
      letterSpacing: 0.2,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 0.1,
    },
  },
};
