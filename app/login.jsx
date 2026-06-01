import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, KeyboardAvoidingView, ScrollView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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
import { makeRedirectUri } from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl + spacing.sm,
  },
  title: {
    ...typography.h2,
    fontSize: 32,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  errorBox: {
    backgroundColor: colors.dangerDim,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md + spacing.xs,
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  form: {
    gap: spacing.md + spacing.xs,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.danger,
  },
  button: {
    backgroundColor: colors.accent,
    minHeight: 56,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  buttonText: {
    color: colors.black,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: letterSpacing.tight,
  },
  linkArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  linkAccent: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    marginTop: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.tight,
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 56,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
})

export default function LoginScreen() {
  const [email, setEmail] = useState('test@gainstreak.app')
  const [password, setPassword] = useState('test1234')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [focused, setFocused] = useState(null)
  const passwordRef = useRef(null)
  const router = useRouter()

  async function handleLogin() {
    Keyboard.dismiss()
    const errors = {}
    if (!email.trim()) errors.email = 'Enter your email'
    if (!password) errors.password = 'Enter your password'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) { setError('Please fill in all fields'); return }
    setError('')
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setError(authError.message); return }
      console.log('[Login] signInWithPassword success, navigating to dashboard')
      router.replace('/(tabs)/dashboard')
    } catch (e) {
      console.log('[Login] error:', e?.message || e)
      setError(e.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    try {
      const redirectTo = makeRedirectUri({ scheme: 'gainstreak' })
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      if (error) { setError(error.message); return }
      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      }
    } catch (e) {
      setError(e.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to continue your streak</Text>
        </View>

        {error ? (
          <View style={styles.errorBox} accessibilityLiveRegion="polite">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                focused === 'email' && styles.inputFocused,
                fieldErrors.email && styles.inputError,
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); setFieldErrors({}) }}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              autoFocus
              onSubmitEditing={() => passwordRef.current?.focus()}
              accessibilityLabel="Email address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              ref={passwordRef}
              style={[
                styles.input,
                focused === 'password' && styles.inputFocused,
                fieldErrors.password && styles.inputError,
              ]}
              placeholder="Your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); setFieldErrors({}) }}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              secureTextEntry
              returnKeyType="go"
              textContentType="password"
              onSubmitEditing={handleLogin}
              accessibilityLabel="Password"
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Log in"
          >
            <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            <Ionicons name="logo-google" size={iconSize.md} color={colors.text} style={{ marginRight: spacing.sm + 2 }} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.linkArea}
          onPress={() => router.push('/signup')}
          accessibilityRole="link"
          accessibilityLabel="Sign up for an account"
        >
          <Text style={styles.linkText}>No account? </Text>
          <Text style={styles.linkAccent}>Sign up</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
