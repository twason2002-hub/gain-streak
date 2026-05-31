import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { withTimeout } from '../../lib/supabaseHelpers'
import { colors, spacing, radii } from '../../constants/theme'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xl,
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
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
  },
  inputError: {
    borderColor: colors.danger,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  recentChip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentChipText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  saveText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.green + '12',
    borderRadius: radii.md,
    padding: 12,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.green + '25',
  },
  savedBannerText: {
    fontSize: 14,
    color: colors.green,
    fontWeight: '700',
  },
  todaysLogSection: {
    marginTop: spacing.xl,
  },
  todaysLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  todaysLogTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  logInfo: {
    flex: 1,
  },
  logExercise: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  logDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyLogHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  emptyLogText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '700',
  },
})

export default function WorkoutScreen() {
  const { user } = useAuth()
  const [exerciseName, setExerciseName] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [recentExercises, setRecentExercises] = useState([])
  const [todaysLog, setTodaysLog] = useState([])
  const [justSaved, setJustSaved] = useState(false)
  const repsRef = useRef(null)
  const weightRef = useRef(null)
  const router = useRouter()

  async function loadTodaysLog() {
    if (!user) return
    try {
      const { data } = await withTimeout(
        supabase.from('workouts')
          .select('exercise_name, reps, weight, created_at')
          .eq('user_id', user.id)
          .eq('date', new Date().toISOString().split('T')[0])
          .order('created_at', { ascending: false })
          .limit(20),
        10000
      )
      if (data) setTodaysLog(data)
    } catch {}
  }

  async function loadRecentExercises() {
    if (!user) return
    try {
      const { data } = await withTimeout(
        supabase.from('workouts')
          .select('exercise_name')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(10),
        10000
      )
      if (data) {
        const unique = [...new Set(data.map(w => w.exercise_name))].slice(0, 5)
        setRecentExercises(unique)
      }
    } catch {}
  }

  useEffect(() => {
    if (!user) return
    loadRecentExercises()
    loadTodaysLog()
  }, [user])

  function selectExercise(name) {
    setExerciseName(name)
    setError('')
    setFieldErrors({})
    setTimeout(() => repsRef.current?.focus(), 100)
  }

  async function handleSave() {
    Keyboard.dismiss()
    const errors = {}
    if (!exerciseName.trim()) errors.exerciseName = 'Enter an exercise name'
    if (!reps || parseInt(reps) <= 0) errors.reps = 'Enter valid reps'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) { setError('Please check the fields above'); return }
    setError('')

    setSaving(true)
    try {
      if (!user) { setError('Not logged in'); setSaving(false); return }

      const { error: dbError } = await withTimeout(
        supabase.from('workouts').insert({
          user_id: user.id,
          exercise_name: exerciseName.trim(),
          reps: parseInt(reps),
          weight: weight ? parseFloat(weight) : 0,
          date: new Date().toISOString().split('T')[0],
        }),
        10000
      )

      if (dbError) { setError(dbError.message); setSaving(false); return }

      setExerciseName('')
      setReps('')
      setWeight('')
      setFieldErrors({})
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
      loadTodaysLog()
      setTimeout(() => repsRef.current?.focus(), 200)
    } catch (e) {
      setError(e.message || 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Log Workout</Text>
      <Text style={styles.date}>{today}</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Exercise</Text>
          <TextInput
            style={[styles.input, fieldErrors.exerciseName && styles.inputError]}
            placeholder="e.g. Bench Press"
            placeholderTextColor={colors.textMuted}
            value={exerciseName}
            onChangeText={(v) => { setExerciseName(v); setError(''); setFieldErrors({}) }}
            autoCapitalize="words"
            returnKeyType="next"
            autoFocus
            onSubmitEditing={() => repsRef.current?.focus()}
          />
          {recentExercises.length > 0 && !exerciseName ? (
            <View style={styles.recentRow}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              {recentExercises.map(name => (
                <TouchableOpacity key={name} activeOpacity={0.7} style={styles.recentChip} onPress={() => selectExercise(name)}>
                  <Text style={styles.recentChipText}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Reps</Text>
            <TextInput
              ref={repsRef}
              style={[styles.input, fieldErrors.reps && styles.inputError]}
              placeholder="10"
              placeholderTextColor={colors.textMuted}
              value={reps}
              onChangeText={(v) => { setReps(v); setError(''); setFieldErrors({}) }}
              keyboardType="number-pad"
              returnKeyType="next"
              onSubmitEditing={() => weightRef.current?.focus()}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              ref={weightRef}
              style={styles.input}
              placeholder="60"
              placeholderTextColor={colors.textMuted}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              returnKeyType="go"
              onSubmitEditing={handleSave}
            />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="barbell-outline" size={18} color={colors.black} style={{ marginRight: 8 }} />
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Workout'}</Text>
        </TouchableOpacity>
      </View>

      {justSaved ? (
        <View style={styles.savedBanner}>
          <Ionicons name="checkmark-circle" size={18} color={colors.green} />
          <Text style={styles.savedBannerText}>Saved! Log another or keep going.</Text>
        </View>
      ) : null}

      {todaysLog.length > 0 ? (
        <View style={styles.todaysLogSection}>
          <View style={styles.todaysLogHeader}>
            <Ionicons name="list-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.todaysLogTitle}>Today's Log ({todaysLog.length})</Text>
          </View>
          {todaysLog.map((entry, i) => (
            <View key={i} style={styles.logRow}>
              <View style={styles.logDot} />
              <View style={styles.logInfo}>
                <Text style={styles.logExercise}>{entry.exercise_name}</Text>
                <Text style={styles.logDetail}>{entry.reps} reps{entry.weight > 0 ? ` @ ${entry.weight}kg` : ''}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyLogHint}>
          <Ionicons name="barbell-outline" size={20} color={colors.textMuted} />
          <Text style={styles.emptyLogText}>Your logged workouts will appear here</Text>
        </View>
      )}
    </ScrollView>
  )
}
