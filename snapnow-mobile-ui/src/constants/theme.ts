/**
 * Design Tokens - SnapNow App
 * Centralized theme constants for consistent UI
 */

// Color Palette
export const COLORS = {
  // Primary
  primary: '#262626',
  primaryLight: '#8E8E8E',
  
  // Instagram Blue
  blue: '#0095F6',
  blueLight: '#E1F5FE',
  
  // Accent
  accent: '#FF3040',
  
  // Background
  background: '#FAFAFA',
  backgroundWhite: '#FFFFFF',
  backgroundGray: '#F8F8F8',
  
  // Borders
  border: '#DBDBDB',
  borderLight: '#EFEFEF',
  
  // Text
  textPrimary: '#262626',
  textSecondary: '#8E8E8E',
  textLight: '#C7C7C7',
  textWhite: '#FFFFFF',
  
  // Status
  success: '#00C851',
  error: '#FF4444',
  warning: '#FFBB33',
  
  // Gradients
  gradientPurple: '#E91E63',
  gradientBlue: '#2196F3',
  gradientPurpleAlt: '#9C27B0',
} as const;

// Typography
export const TYPOGRAPHY = {
  // Font Sizes
  fontSize: {
    xs: 11,
    sm: 12,
    base: 13,
    md: 14,
    lg: 15,
    xl: 16,
    xxl: 18,
    xxxl: 22,
    display: 24,
  },
  
  // Font Weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line Heights
  lineHeight: {
    tight: 18,
    base: 20,
    relaxed: 24,
  },
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

// Border Radius
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  round: 24,
  circle: 9999,
} as const;

// Sizes
export const SIZES = {
  // Avatar sizes
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    xxl: 80,
  },
  
  // Icon sizes
  icon: {
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
  },
  
  // Input heights
  input: {
    sm: 36,
    md: 44,
    lg: 52,
  },
} as const;

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Timings
export const TIMINGS = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

// Z-Index
export const Z_INDEX = {
  base: 1,
  dropdown: 10,
  modal: 100,
  overlay: 1000,
  tooltip: 10000,
} as const;

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SIZES,
  SHADOWS,
  TIMINGS,
  Z_INDEX,
};
