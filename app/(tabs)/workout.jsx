import { useState, useRef, useEffect, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, Keyboard, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { withTimeout } from '../../lib/supabaseHelpers'
import {
  colors,
  spacing,
  radii,
  typography,
  letterSpacing,
  shadows,
  iconSize,
} from '../../constants/theme'
import Dot from '../../components/Dot'
import PlateCalculator from '../../components/PlateCalculator'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  date: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  todayStats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  todayStat: {
    flex: 1,
    alignItems: 'center',
  },
  todayStatDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  todayStatNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  todayStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.normal,
    marginTop: spacing.xs,
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
    gap: spacing.sm + spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
  },
  inputFocused: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.danger,
  },
  weightInputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  weightInput: {
    paddingRight: 56,
  },
  calcBtn: {
    position: 'absolute',
    right: spacing.sm,
    top: 0,
    bottom: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  calcBtnDisabled: {
    opacity: 0.4,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm + 2,
  },
  recentChip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 32,
    justifyContent: 'center',
  },
  recentChipText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: colors.accent,
    minHeight: 56,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    ...shadows.button,
  },
  saveText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.normal,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.green + '12',
    borderRadius: radii.md,
    padding: spacing.sm + spacing.xs,
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
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  todaysLogTitle: {
    ...typography.label,
    color: colors.text,
  },
  logCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
  },
  logRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logInfo: {
    flex: 1,
  },
  logExercise: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
  },
  logDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 18,
  },
  logWeightChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.accentDim,
    borderColor: colors.accent + '40',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    minWidth: 60,
    justifyContent: 'center',
  },
  logWeightValue: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '900',
  },
  logWeightUnit: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 2,
    opacity: 0.8,
  },
  logRepsOnly: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyLogHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  emptyLogText: {
    fontSize: 12,
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
  const [focused, setFocused] = useState(null)
  const [calcOpen, setCalcOpen] = useState(false)
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

  function refillFromEntry(entry) {
    setExerciseName(entry.exercise_name)
    setReps(String(entry.reps || ''))
    setWeight(entry.weight > 0 ? String(entry.weight) : '')
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

  const todayStats = useMemo(() => {
    const sets = todaysLog.length
    const reps = todaysLog.reduce((sum, e) => sum + (e.reps || 0), 0)
    const volume = todaysLog.reduce((sum, e) => sum + (e.reps || 0) * (e.weight || 0), 0)
    return { sets, reps, volume }
  }, [todaysLog])

  const weightNum = parseFloat(weight)
  const calcEnabled = !isNaN(weightNum) && weightNum > 0

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Log Workout</Text>
      <Text style={styles.date}>{today}</Text>

      {todaysLog.length > 0 ? (
        <View style={styles.todayStats}>
          <View style={styles.todayStat}>
            <Text style={styles.todayStatNumber}>{todayStats.sets}</Text>
            <Text style={styles.todayStatLabel}>Sets</Text>
          </View>
          <View style={styles.todayStatDivider} />
          <View style={styles.todayStat}>
            <Text style={styles.todayStatNumber}>{todayStats.reps}</Text>
            <Text style={styles.todayStatLabel}>Reps</Text>
          </View>
          <View style={styles.todayStatDivider} />
          <View style={styles.todayStat}>
            <Text style={styles.todayStatNumber}>{Math.round(todayStats.volume)}</Text>
            <Text style={styles.todayStatLabel}>Volume kg</Text>
          </View>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox} accessibilityLiveRegion="polite">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Exercise</Text>
          <TextInput
            style={[
              styles.input,
              focused === 'exerciseName' && styles.inputFocused,
              fieldErrors.exerciseName && styles.inputError,
            ]}
            placeholder="e.g. Bench Press"
            placeholderTextColor={colors.textMuted}
            value={exerciseName}
            onChangeText={(v) => { setExerciseName(v); setError(''); setFieldErrors({}) }}
            onFocus={() => setFocused('exerciseName')}
            onBlur={() => setFocused(null)}
            autoCapitalize="words"
            returnKeyType="next"
            autoFocus
            onSubmitEditing={() => repsRef.current?.focus()}
            accessibilityLabel="Exercise name"
          />
          {recentExercises.length > 0 && !exerciseName ? (
            <View style={styles.recentRow}>
              <Ionicons name="time-outline" size={iconSize.sm - 2} color={colors.textMuted} />
              {recentExercises.map(name => (
                <TouchableOpacity
                  key={name}
                  activeOpacity={0.7}
                  style={styles.recentChip}
                  onPress={() => selectExercise(name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${name}`}
                >
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
              style={[
                styles.input,
                focused === 'reps' && styles.inputFocused,
                fieldErrors.reps && styles.inputError,
              ]}
              placeholder="10"
              placeholderTextColor={colors.textMuted}
              value={reps}
              onChangeText={(v) => { setReps(v); setError(''); setFieldErrors({}) }}
              onFocus={() => setFocused('reps')}
              onBlur={() => setFocused(null)}
              keyboardType="number-pad"
              returnKeyType="next"
              onSubmitEditing={() => weightRef.current?.focus()}
              accessibilityLabel="Reps"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Weight (kg)</Text>
            </View>
            <View style={styles.weightInputWrap}>
              <TextInput
                ref={weightRef}
                style={[
                  styles.input,
                  styles.weightInput,
                  focused === 'weight' && styles.inputFocused,
                ]}
                placeholder="60"
                placeholderTextColor={colors.textMuted}
                value={weight}
                onChangeText={setWeight}
                onFocus={() => setFocused('weight')}
                onBlur={() => setFocused(null)}
                keyboardType="decimal-pad"
                returnKeyType="go"
                onSubmitEditing={handleSave}
                accessibilityLabel="Weight in kilograms"
              />
              <Pressable
                onPress={() => calcEnabled && setCalcOpen(true)}
                disabled={!calcEnabled}
                style={({ pressed }) => [
                  styles.calcBtn,
                  !calcEnabled && styles.calcBtnDisabled,
                  pressed && calcEnabled && { opacity: 0.6 },
                ]}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Open plate calculator"
              >
                <Ionicons
                  name="calculator-outline"
                  size={iconSize.md}
                  color={calcEnabled ? colors.accent : colors.textMuted}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            saving && { opacity: 0.6 },
            pressed && !saving && { transform: [{ scale: 0.98 }], opacity: 0.9 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save workout"
        >
          <Ionicons name="barbell-outline" size={iconSize.sm + 2} color={colors.black} style={{ marginRight: spacing.sm }} />
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Workout'}</Text>
        </Pressable>
      </View>

      {justSaved ? (
        <View style={styles.savedBanner} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={iconSize.sm + 2} color={colors.green} />
          <Text style={styles.savedBannerText}>Saved! Log another or keep going.</Text>
        </View>
      ) : null}

      {todaysLog.length > 0 ? (
        <View style={styles.todaysLogSection}>
          <View style={styles.todaysLogHeader}>
            <Ionicons name="list-outline" size={iconSize.sm} color={colors.textSecondary} />
            <Text style={styles.todaysLogTitle}>Today's Log ({todaysLog.length})</Text>
          </View>
          <View style={styles.logCard}>
            {todaysLog.map((entry, i) => {
              const last = i === todaysLog.length - 1
              return (
                <Pressable
                  key={i}
                  onPress={() => refillFromEntry(entry)}
                  style={({ pressed }) => [
                    styles.logRow,
                    !last && styles.logRowBorder,
                    pressed && { backgroundColor: colors.surfaceLight },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Refill form with ${entry.exercise_name}`}
                >
                  <Dot size={10} filled color={colors.green} />
                  <View style={styles.logInfo}>
                    <Text style={styles.logExercise}>{entry.exercise_name}</Text>
                    <Text style={styles.logDetail}>{entry.reps} reps</Text>
                  </View>
                  {entry.weight > 0 ? (
                    <View style={styles.logWeightChip}>
                      <Text style={styles.logWeightValue}>{entry.weight}</Text>
                      <Text style={styles.logWeightUnit}>KG</Text>
                    </View>
                  ) : (
                    <Text style={styles.logRepsOnly}>×{entry.reps}</Text>
                  )}
                </Pressable>
              )
            })}
          </View>
        </View>
      ) : (
        <View style={styles.emptyLogHint}>
          <Ionicons name="barbell-outline" size={iconSize.md} color={colors.textMuted} />
          <Text style={styles.emptyLogText}>Your logged workouts will appear here</Text>
        </View>
      )}

      <PlateCalculator
        visible={calcOpen}
        onClose={() => setCalcOpen(false)}
        totalWeight={weight}
      />
    </ScrollView>
  )
}
