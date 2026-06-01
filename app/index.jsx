import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../lib/AuthContext'
import {
  colors,
  spacing,
  radii,
  typography,
  letterSpacing,
  shadows,
  iconSize,
} from '../constants/theme'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: colors.accentDim,
    opacity: 0.15,
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
    transform: [{ scaleY: 1.5 }],
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl + spacing.md,
  },
  logoBadgeContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg + spacing.xs,
  },
  outerGlow: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    borderColor: colors.accent,
    opacity: 0.25,
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow(colors.accent),
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm + spacing.xs,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm + 2,
    opacity: 0.9,
    paddingHorizontal: spacing.sm + spacing.xs,
    lineHeight: 24,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md + spacing.xs,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    minHeight: 56,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  primaryText: {
    color: colors.black,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: letterSpacing.tight,
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    minHeight: 56,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent + '55',
  },
  secondaryText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
})

export default function HomeScreen() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      console.log('[HomeScreen] session exists, redirecting to dashboard')
      router.replace('/(tabs)/dashboard')
    }
  }, [user, loading])

  if (loading) return null

  return (
    <View style={styles.container}>
      <View style={styles.topGradient} />

      <View style={styles.hero}>
        <View style={styles.logoBadgeContainer}>
          <View style={styles.outerGlow} />
          <View style={styles.logoRing}>
            <Ionicons name="flash" size={iconSize.xl + 10} color={colors.accent} />
          </View>
        </View>

        <Text style={styles.title}>GAIN<Text style={{ color: colors.accent }}>STREAK</Text></Text>
        <Text style={styles.subtitle}>Show up 3 days a week. Every week.</Text>
        <Text style={styles.tagline}>Build consistency. Earn badges. Never break the chain.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryBtn}
          onPress={() => router.push('/login')}
          accessibilityRole="button"
          accessibilityLabel="Log in"
        >
          <Text style={styles.primaryText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryBtn}
          onPress={() => router.push('/signup')}
          accessibilityRole="button"
          accessibilityLabel="Create account"
        >
          <Text style={styles.secondaryText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
