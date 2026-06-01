import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { calculateStreak } from '../lib/streak'
import {
  colors,
  spacing,
  radii,
  typography,
  letterSpacing,
  shadows,
} from '../constants/theme'
import StreakHero from '../components/StreakHero'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingPulse: {
    height: 16,
    width: '80%',
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    marginTop: 6,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  heroWrap: {
    marginBottom: spacing.lg,
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
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
    padding: spacing.md - 2,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  inputFocused: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md - 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    marginVertical: spacing.xs,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    minHeight: 56,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadows.button,
  },
  saveText: {
    color: colors.black,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: letterSpacing.tight,
  },
  cancelBtn: {
    minHeight: 48,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
})

export default function EditProfileScreen() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(null)
  const [streakData, setStreakData] = useState({ streak: 0, totalCompleteWeeks: 0, currentWeekDays: 0 })
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      try {
        const [profileResult, workoutsResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('workouts').select('date').eq('user_id', user.id),
        ])
        if (profileResult.error) { setError(profileResult.error.message); return }
        const data = profileResult.data
        if (data) {
          setDisplayName(data.display_name || '')
          setBio(data.bio || '')
          setAge(data.age ? String(data.age) : '')
          setHeight(data.height_cm ? String(data.height_cm) : '')
          setWeight(data.weight_kg ? String(data.weight_kg) : '')
        }
        if (workoutsResult.data) {
          setStreakData(calculateStreak(workoutsResult.data, 3))
        }
      } catch (e) {
        setError(e.message || 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [user])

  async function handleSave() {
    Keyboard.dismiss()
    if (!user) return

    setSaving(true)
    const { error: dbError } = await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      age: age ? parseInt(age) : null,
      height_cm: height ? parseInt(height) : null,
      weight_kg: weight ? parseFloat(weight) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    setSaving(false)

    if (dbError) { setError(dbError.message); return }
    router.back()
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingPulse} />
        <View style={[styles.loadingPulse, { width: '60%', marginTop: 12 }]} />
        <View style={[styles.loadingPulse, { width: '40%', marginTop: 8 }]} />
      </View>
    )
  }

  const inputStyle = (key) => [
    styles.input,
    focused === key && styles.inputFocused,
  ]

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Edit Profile</Text>
      <Text style={styles.subtitle}>Update your athlete profile</Text>

      <View style={styles.heroWrap}>
        <StreakHero
          streak={streakData.streak}
          totalWeeks={streakData.totalCompleteWeeks}
          size="sm"
        />
      </View>

      {error ? (
        <View style={styles.errorBox} accessibilityLiveRegion="polite">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={inputStyle('displayName')}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
            onFocus={() => setFocused('displayName')}
            onBlur={() => setFocused(null)}
            returnKeyType="next"
            accessibilityLabel="Display name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[...inputStyle('bio'), styles.textArea]}
            placeholder="Tell your gym story..."
            placeholderTextColor={colors.textMuted}
            value={bio}
            onChangeText={setBio}
            onFocus={() => setFocused('bio')}
            onBlur={() => setFocused(null)}
            multiline
            numberOfLines={3}
            accessibilityLabel="Bio"
          />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>Body Stats</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={inputStyle('age')}
              placeholder="25"
              placeholderTextColor={colors.textMuted}
              value={age}
              onChangeText={setAge}
              onFocus={() => setFocused('age')}
              onBlur={() => setFocused(null)}
              keyboardType="number-pad"
              accessibilityLabel="Age"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={inputStyle('height')}
              placeholder="175"
              placeholderTextColor={colors.textMuted}
              value={height}
              onChangeText={setHeight}
              onFocus={() => setFocused('height')}
              onBlur={() => setFocused(null)}
              keyboardType="number-pad"
              accessibilityLabel="Height in centimeters"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={inputStyle('weight')}
              placeholder="80"
              placeholderTextColor={colors.textMuted}
              value={weight}
              onChangeText={setWeight}
              onFocus={() => setFocused('weight')}
              onBlur={() => setFocused(null)}
              keyboardType="decimal-pad"
              accessibilityLabel="Weight in kilograms"
            />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
        >
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.cancelBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cancel and go back"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
