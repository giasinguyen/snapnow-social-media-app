// Instagram-inspired colors
export const COLORS = {
  // Primary
  primary: '#0095F6',
  primaryLight: '#B2DFFC',
  primaryDark: '#0066CC',

  // Background
  background: '#FFFFFF',
  backgroundLight: '#FAFAFA',
  backgroundDark: '#000000',

  // Text
  textPrimary: '#262626',
  textSecondary: '#8E8E8E',
  textTertiary: '#C7C7C7',
  textWhite: '#FFFFFF',

  // Border
  border: '#DBDBDB',
  borderLight: '#EFEFEF',

  // Status
  danger: '#ED4956',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',

  // Social
  like: '#ED4956',
  comment: '#262626',
  share: '#262626',

  // Gradient (for stories, avatars)
  gradientStart: '#F58529',
  gradientMiddle1: '#DD2A7B',
  gradientMiddle2: '#8134AF',
  gradientEnd: '#515BD4',
} as const;

export const GRADIENT_COLORS = [
  COLORS.gradientStart,
  COLORS.gradientMiddle1,
  COLORS.gradientMiddle2,
  COLORS.gradientEnd,
];

export default COLORS;
