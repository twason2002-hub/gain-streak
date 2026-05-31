import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { colors, spacing, radii } from '../constants/theme'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 60,
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
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    marginTop: 4,
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: {
    color: colors.black,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelBtn: {
    paddingVertical: 16,
    borderRadius: radii.lg,
    alignItems: 'center',
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
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (error) { setError(error.message); return }
        if (data) {
          setDisplayName(data.display_name || '')
          setBio(data.bio || '')
          setAge(data.age ? String(data.age) : '')
          setHeight(data.height_cm ? String(data.height_cm) : '')
          setWeight(data.weight_kg ? String(data.weight_kg) : '')
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Edit Profile</Text>
      <Text style={styles.subtitle}>Update your athlete profile</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell your gym story..."
            placeholderTextColor={colors.textMuted}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
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
              style={styles.input}
              placeholder="25"
              placeholderTextColor={colors.textMuted}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="175"
              placeholderTextColor={colors.textMuted}
              value={height}
              onChangeText={setHeight}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="80"
              placeholderTextColor={colors.textMuted}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
