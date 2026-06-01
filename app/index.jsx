import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../lib/AuthContext'
import { signInAsGuest } from '../lib/guestAuth'
import { supabase } from '../lib/supabase'
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
  guestBtn: {
    minHeight: 56,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },
  guestText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
})

export default function HomeScreen() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [guestLoading, setGuestLoading] = useState(false)
  const [guestError, setGuestError] = useState('')

  useEffect(() => {
    if (!loading && user) {
      console.log('[HomeScreen] session exists, redirecting to dashboard')
      router.replace('/(tabs)/dashboard')
    }
  }, [user, loading])

  async function handleGuestSignIn() {
    setGuestLoading(true)
    setGuestError('')
    try {
      await signInAsGuest(supabase)
    } catch (e) {
      setGuestError(e.message || 'Failed to sign in as guest')
    } finally {
      setGuestLoading(false)
    }
  }

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

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.guestBtn}
          onPress={handleGuestSignIn}
          disabled={guestLoading}
          accessibilityRole="button"
          accessibilityLabel="Continue as guest"
        >
          {guestLoading ? (
            <ActivityIndicator color={colors.textSecondary} />
          ) : (
            <>
              <Ionicons name="person-outline" size={iconSize.sm} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
              <Text style={styles.guestText}>Continue as Guest</Text>
            </>
          )}
        </TouchableOpacity>

        {guestError ? (
          <Text style={{ color: colors.danger, fontSize: 13, textAlign: 'center', marginTop: spacing.sm, fontWeight: '600' }}>
            {guestError}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
