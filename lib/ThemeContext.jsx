import { createContext, useContext, useState } from 'react'

const darkColors = {
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

const lightColors = {
  bg: '#F5F5F7',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceLight: '#F2F2F5',
  surfaceHighlight: '#E8E8ED',
  card: '#FFFFFF',
  border: '#D1D1D6',
  borderLight: '#C7C7CC',
  text: '#1C1C1E',
  textSecondary: '#636366',
  textMuted: '#AEAEB2',
  accent: '#CCFF00',
  accentDim: 'rgba(204, 255, 0, 0.15)',
  accentGlow: 'rgba(204, 255, 0, 0.25)',
  green: '#34C759',
  orange: '#FF5E00',
  orangeBr: '#FF7A22',
  red: '#FF3B30',
  gold: '#FFD60A',
  purple: '#AF52DE',
  teal: '#30B0C7',
  blue: '#007AFF',
  pink: '#FF2D55',
  white: '#FFFFFF',
  black: '#000000',
  danger: '#FF3B30',
  dangerDim: 'rgba(255, 59, 48, 0.12)',
}

const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
const radii = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 }

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true)

  function toggleTheme() {
    setIsDark(prev => !prev)
  }

  const colors = isDark ? darkColors : lightColors

  return (
    <ThemeContext.Provider value={{ colors, spacing, radii, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
