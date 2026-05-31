import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, KeyboardAvoidingView, ScrollView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { colors, spacing, radii } from '../constants/theme'
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
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
    letterSpacing: 0.5,
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    padding: 16,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
})

export default function LoginScreen() {
  const [email, setEmail] = useState('demo@gainstreak.app')
  const [password, setPassword] = useState('demo123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
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
              placeholder="Your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); setFieldErrors({}) }}
              secureTextEntry
              returnKeyType="go"
              textContentType="password"
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={20} color={colors.text} style={{ marginRight: 10 }} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.7} style={styles.linkArea} onPress={() => router.push('/signup')}>
          <Text style={styles.linkText}>No account? </Text>
          <Text style={styles.linkAccent}>Sign up</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
