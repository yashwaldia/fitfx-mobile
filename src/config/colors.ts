// ✅ Aurora Gradient Colors (Primary Brand Colors)
export const AURORA_GRADIENT = {
  cyan: '#00D9FF',
  pink: '#FF006E',
  orange: '#FFA500',
  purple: '#B300FF',
};

// ✅ Dark Theme Colors (Neumorphic Design)
export const NEUMORPHIC = {
  bg: '#0A0E27',
  bgLight: '#1A1F3A',
  bgDarker: '#050810',
  textPrimary: '#FFFFFF',
  textSecondary: '#D8E1F0',
  textTertiary: '#B5C4D8',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  borderDark: 'rgba(0, 0, 0, 0.3)',
};

// ✅ Glassmorphism Colors
export const GLASS = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  blur: 20, // For backdrop filter
};

// ✅ Subscription Tier Colors
export const SUBSCRIPTION_COLORS = {
  free: {
    primary: '#8B92A6',
    gradient: ['#6B7280', '#9CA3AF'],
    bg: 'rgba(139, 146, 166, 0.1)',
  },
  premium: {
    primary: AURORA_GRADIENT.cyan,
    gradient: [AURORA_GRADIENT.cyan, AURORA_GRADIENT.purple],
    bg: 'rgba(0, 217, 255, 0.1)',
  },
  elite: {
    primary: AURORA_GRADIENT.orange,
    gradient: [AURORA_GRADIENT.orange, AURORA_GRADIENT.pink],
    bg: 'rgba(255, 165, 0, 0.1)',
  },
};

// ✅ Icon Grid Colors (For Feature Icons)
export const ICON_GRID = {
  selfie: AURORA_GRADIENT.cyan,
  wardrobe: AURORA_GRADIENT.purple,
  suggestions: AURORA_GRADIENT.orange,
  settings: AURORA_GRADIENT.pink,
  profile: AURORA_GRADIENT.cyan,
  chat: AURORA_GRADIENT.purple,
};

// ✅ Status Colors
export const STATUS_COLORS = {
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: AURORA_GRADIENT.cyan,
};

// ✅ Base Theme Spacing & Typography (Simple version)
export const BASE_THEME = {
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
    full: 999,
  },
  typography: {
    heading1: { fontSize: 28, fontWeight: '800' as const, lineHeight: 36 },
    heading2: { fontSize: 22, fontWeight: '800' as const, lineHeight: 30 },
    heading3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 26 },
    body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  },
};
