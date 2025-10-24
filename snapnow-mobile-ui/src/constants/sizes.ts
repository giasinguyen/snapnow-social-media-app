// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Font Sizes
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  huge: 32,
} as const;

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
} as const;

// Avatar Sizes
export const AVATAR_SIZES = {
  small: 32,
  medium: 40,
  large: 80,
  xlarge: 120,
  profile: 150,
} as const;

// Screen Dimensions (approximate)
export const SCREEN = {
  maxWidth: 600, // Max width for web/tablet
  tabBarHeight: 50,
  headerHeight: 56,
} as const;

// Animation Durations (ms)
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export default {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  AVATAR_SIZES,
  SCREEN,
  ANIMATION,
};
