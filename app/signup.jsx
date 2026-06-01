import { useState, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Keyboard, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import {
  colors,
  spacing,
  radii,
  typography,
  letterSpacing,
  shadows,
} from '../constants/theme'

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
  successCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
    color: colors.green,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
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
})

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [focused, setFocused] = useState(null)
  const passwordRef = useRef(null)
  const router = useRouter()

  async function handleSignup() {
    Keyboard.dismiss()
    const errors = {}
    if (!email.trim()) errors.email = 'Enter your email'
    if (password.length < 6) errors.password = 'Password must be at least 6 characters'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) { setError('Please check the fields above'); return }
    setError('')
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) { setError(authError.message); return }
      setSuccess(true)
    } catch (e) {
      setError(e.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <View style={styles.screen}>
        <View style={styles.container}>
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successText}>
              We sent a confirmation link to {email}. Verify your account then log in.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.button}
              onPress={() => router.replace('/login')}
              accessibilityRole="button"
              accessibilityLabel="Go to login screen"
            >
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start building your streak today</Text>
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
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); setFieldErrors({}) }}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              secureTextEntry
              returnKeyType="go"
              textContentType="newPassword"
              onSubmitEditing={handleSignup}
              accessibilityLabel="Password"
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleSignup}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.linkArea}
          onPress={() => router.push('/login')}
          accessibilityRole="link"
          accessibilityLabel="Go to login screen"
        >
          <Text style={styles.linkText}>Already have an account? </Text>
          <Text style={styles.linkAccent}>Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
