import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../lib/AuthContext'
import { colors, spacing, radii } from '../constants/theme'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: 24,
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
    marginBottom: 64,
  },
  logoBadgeContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
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
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 44,
    fontWeight: '950',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -1.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.9,
    paddingHorizontal: 12,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  actions: {
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: radii.lg,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryText: {
    color: colors.black,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    paddingVertical: 18,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
            <Ionicons name="flash" size={38} color={colors.accent} />
          </View>
        </View>

        <Text style={styles.title}>GAIN<Text style={{ color: colors.accent }}>STREAK</Text></Text>
        <Text style={styles.subtitle}>Show up 3 days a week. Every week.</Text>
        <Text style={styles.tagline}>Build consistency. Earn badges. Never break the chain.</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn} onPress={() => router.push('/login')}>
          <Text style={styles.primaryText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.75} style={styles.secondaryBtn} onPress={() => router.push('/signup')}>
          <Text style={styles.secondaryText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
