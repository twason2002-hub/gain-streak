export const colors = {
  bg: '#08090C',
  bgElevated: '#11131A',
  surface: '#151722',
  surfaceLight: '#1C1F2D',
  surfaceHighlight: '#242838',
  card: '#151722',
  border: '#202433',
  borderLight: '#2C3044',
  text: '#FFFFFF',
  textSecondary: '#8D93A3',
  textMuted: '#4F5568',
  accent: '#CCFF00',
  accentDim: 'rgba(204, 255, 0, 0.08)',
  accentGlow: 'rgba(204, 255, 0, 0.18)',
  green: '#00E676',
  orange: '#FF5E00',
  orangeBr: '#FF7A22',
  red: '#FF3B30',
  gold: '#FFD60A',
  purple: '#BF5AF2',
  teal: '#30D158',
  blue: '#0A84FF',
  pink: '#FF375F',
  white: '#FFFFFF',
  black: '#000000',
  danger: '#FF3B30',
  dangerDim: 'rgba(255, 59, 48, 0.12)',
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
}

export const letterSpacing = {
  tight: 0.5,
  normal: 1,
  wide: 1.5,
}

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
}

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 }

export const typography = {
  h1: {
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 48,
    letterSpacing: -1.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: -0.25,
  },
  body: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
}

export const shadows = {
  card: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  button: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 6,
  }),
}
