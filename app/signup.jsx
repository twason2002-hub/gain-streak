import { useState, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Keyboard, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { colors, spacing, radii } from '../constants/theme'

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  successCard: {
    alignItems: 'center',
    gap: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.green,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  errorBox: {
    backgroundColor: colors.dangerDim,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  errorText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  button: {
    backgroundColor: colors.accent,
    padding: 18,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.black,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  linkArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
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
            <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={() => router.replace('/login')}>
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
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, fieldErrors.email && styles.inputError]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); setFieldErrors({}) }}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              autoFocus
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              ref={passwordRef}
              style={[styles.input, fieldErrors.password && styles.inputError]}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); setFieldErrors({}) }}
              secureTextEntry
              returnKeyType="go"
              textContentType="newPassword"
              onSubmitEditing={handleSignup}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.7} style={styles.linkArea} onPress={() => router.push('/login')}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <Text style={styles.linkAccent}>Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
