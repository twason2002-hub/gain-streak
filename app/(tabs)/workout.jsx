import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet,
  ScrollView, Alert, Animated, Vibration
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { withTimeout } from '../../lib/supabaseHelpers'
import { calculatePRs } from '../../lib/prs'
import {
  colors,
  spacing,
  radii,
  typography,
  letterSpacing,
  shadows,
  iconSize,
} from '../../constants/theme'

const AUTO_COMPLETE_MIN = 30
const AUTO_COMPLETE_MS = AUTO_COMPLETE_MIN * 60 * 1000
const REST_TIMER_DEFAULT = 60

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl + spacing.sm },
  title: { ...typography.h2, color: colors.text },
  date: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, marginTop: spacing.xs, lineHeight: 20 },

  startCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xl,
  },
  startIcon: { marginBottom: spacing.md },
  startTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: spacing.sm },
  startSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  startBtn: {
    backgroundColor: colors.accent,
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.lg,
    alignItems: 'center',
    flexDirection: 'row',
    ...shadows.button,
  },
  startBtnText: { color: colors.black, fontSize: 17, fontWeight: '900', textTransform: 'uppercase' },

  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentDim,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  timerText: { fontSize: 14, fontWeight: '800', color: colors.accent, fontVariant: ['tabular-nums'] },

  exerciseSection: { marginBottom: spacing.lg },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  exerciseName: { fontSize: 16, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
  exerciseBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.green,
    backgroundColor: colors.green + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginLeft: spacing.sm,
  },

  setsTable: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  setsHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setHeaderCell: { fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: letterSpacing.normal },
  setHeaderSet: { width: 36 },
  setHeaderWeight: { flex: 1 },
  setHeaderReps: { width: 50, textAlign: 'center' },
  setHeaderActions: { width: 80, textAlign: 'right' },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
  },
  setRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  setNumber: { width: 36, fontSize: 14, fontWeight: '800', color: colors.textMuted },
  setWeight: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.text },
  setReps: { width: 50, fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  setPrBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.green,
    backgroundColor: colors.green + '20',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: spacing.xs,
  },

  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: spacing.lg,
  },
  addExerciseText: { fontSize: 14, fontWeight: '800', color: colors.accent },

  addSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  miniInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm + spacing.xs,
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  miniInputWeight: { flex: 2 },
  miniInputReps: { flex: 1 },
  addSetBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    padding: spacing.sm + spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 40,
  },

  restTimerOverlay: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '60',
    ...shadows.glow(colors.accent),
    zIndex: 10,
  },
  restTimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  restTimerTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  restTimerClose: { padding: spacing.xs },
  restTimerDisplay: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  restTimerBig: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  restTimerPresets: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  restPresetBtn: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restPresetBtnActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent + '60',
  },
  restPresetText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  restPresetTextActive: { color: colors.accent },

  completeBtn: {
    backgroundColor: colors.green,
    minHeight: 56,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...shadows.button,
    marginTop: spacing.lg,
  },
  completeBtnText: { color: colors.black, fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },

  deleteSetBtn: { padding: spacing.xs },
})

export default function WorkoutScreen() {
  const { user } = useAuth()
  const router = useRouter()

  const [session, setSession] = useState(null)
  const [exercises, setExercises] = useState([])
  const [elapsed, setElapsed] = useState(0)
  const [restTimer, setRestTimer] = useState(null)
  const [restSeconds, setRestSeconds] = useState(REST_TIMER_DEFAULT)
  const [restPreset, setRestPreset] = useState(REST_TIMER_DEFAULT)
  const [recentExercises, setRecentExercises] = useState([])
  const [existingPRs, setExistingPRs] = useState({})
  const [newPRs, setNewPRs] = useState([])
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')

  const timerRef = useRef(null)
  const restRef = useRef(null)
  const inactivityRef = useRef(null)
  const autoWarnRef = useRef(null)
  const pulseAnim = useRef(new Animated.Value(1)).current

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const resetInactivityTimer = useCallback(() => {
    if (autoWarnRef.current) clearTimeout(autoWarnRef.current)
    if (inactivityRef.current) clearTimeout(inactivityRef.current)

    if (!session || session.status !== 'active') return

    autoWarnRef.current = setTimeout(() => {
      Alert.alert(
        'Workout Auto-Complete',
        `Your workout will auto-complete in 2 minutes due to inactivity.`,
        [{ text: 'Keep Working Out', onPress: resetInactivityTimer }]
      )
    }, AUTO_COMPLETE_MS - 120000)

    inactivityRef.current = setTimeout(async () => {
      await completeSession('auto_completed')
    }, AUTO_COMPLETE_MS)
  }, [session])

  const resetInactivityTimerRef = useRef(resetInactivityTimer)
  useEffect(() => { resetInactivityTimerRef.current = resetInactivityTimer }, [resetInactivityTimer])

  async function startSession() {
    if (!user) return
    const { data, error } = await withTimeout(
      supabase.from('workout_sessions').insert({
        user_id: user.id,
        status: 'active',
      }).select().single(),
      10000
    )
    if (error) { Alert.alert('Error', error.message); return }
    setSession(data)
    loadRecentExercises()
    loadExistingPRs()
  }

  async function loadRecentExercises() {
    if (!user) return
    try {
      const { data } = await withTimeout(
        supabase.from('workout_sets').select('exercise_name').eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(20),
        10000
      )
      if (data) {
        const unique = [...new Set(data.map(w => w.exercise_name))].slice(0, 8)
        setRecentExercises(unique)
      }
    } catch {}
  }

  async function loadExistingPRs() {
    if (!user) return
    try {
      const { data } = await withTimeout(
        supabase.from('workout_sets').select('exercise_name, reps, weight, created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false }),
        10000
      )
      if (data) {
        const prs = calculatePRs(data)
        const map = {}
        prs.exercises.forEach(e => { map[e.name] = e.bestWeight.value })
        setExistingPRs(map)
      }
    } catch {}
  }

  useEffect(() => {
    if (!session || session.status !== 'active') return

    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (restRef.current) clearInterval(restRef.current)
      if (inactivityRef.current) clearTimeout(inactivityRef.current)
      if (autoWarnRef.current) clearTimeout(autoWarnRef.current)
    }
  }, [session?.id, session?.status])

  function addExercise(name) {
    if (!name.trim()) return
    setExercises(prev => [...prev, { name: name.trim(), sets: [] }])
    setNewExerciseName('')
    setShowAddExercise(false)
    resetInactivityTimerRef.current()
  }

  function removeExercise(index) {
    setExercises(prev => prev.filter((_, i) => i !== index))
    resetInactivityTimerRef.current()
  }

  function addSet(exerciseIndex, weight, reps) {
    const w = parseFloat(weight) || 0
    const r = parseInt(reps) || 0
    if (r <= 0) return

    setExercises(prev => {
      const updated = [...prev]
      const ex = { ...updated[exerciseIndex] }
      const setNum = ex.sets.length + 1
      ex.sets = [...ex.sets, { set_number: setNum, weight: w, reps: r, isPR: false }]

      if (w > 0 && w > (existingPRs[ex.name] || 0)) {
        ex.sets[ex.sets.length - 1].isPR = true
        setNewPRs(prev => [...prev, { exercise: ex.name, weight: w, reps: r }])
        setExistingPRs(prev => ({ ...prev, [ex.name]: w }))
        Vibration.vibrate([0, 100, 50, 100])
      }

      updated[exerciseIndex] = ex
      return updated
    })
    resetInactivityTimerRef.current()
  }

  function removeSet(exerciseIndex, setIndex) {
    setExercises(prev => {
      const updated = [...prev]
      const ex = { ...updated[exerciseIndex] }
      ex.sets = ex.sets.filter((_, i) => i !== setIndex).map((s, i) => ({ ...s, set_number: i + 1 }))
      updated[exerciseIndex] = ex
      return updated
    })
    resetInactivityTimerRef.current()
  }

  function startRestTimer(seconds) {
    setRestPreset(seconds)
    setRestSeconds(seconds)
    setRestTimer(true)
    if (restRef.current) clearInterval(restRef.current)
    restRef.current = setInterval(() => {
      setRestSeconds(prev => {
        if (prev <= 1) {
          clearInterval(restRef.current)
          setRestTimer(null)
          Vibration.vibrate([0, 200, 100, 200, 100, 200])
          Alert.alert('Rest Complete', 'Time to go again!')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopRestTimer() {
    if (restRef.current) clearInterval(restRef.current)
    setRestTimer(null)
  }

  async function completeSession(status = 'completed') {
    if (!session) return
    if (timerRef.current) clearInterval(timerRef.current)
    if (restRef.current) clearInterval(restRef.current)
    if (inactivityRef.current) clearTimeout(inactivityRef.current)
    if (autoWarnRef.current) clearTimeout(autoWarnRef.current)

    await withTimeout(
      supabase.from('workout_sessions')
        .update({ status, completed_at: new Date().toISOString(), last_activity_at: new Date().toISOString() })
        .eq('id', session.id),
      10000
    )

    const setsToInsert = []
    exercises.forEach(ex => {
      ex.sets.forEach(s => {
        setsToInsert.push({
          session_id: session.id,
          user_id: user.id,
          exercise_name: ex.name,
          reps: s.reps,
          weight: s.weight,
          set_number: s.set_number,
        })
      })
    })

    if (setsToInsert.length > 0) {
      await withTimeout(supabase.from('workout_sets').insert(setsToInsert), 10000)
    }

    setSession(prev => prev ? { ...prev, status } : null)
    if (status === 'completed') {
      Alert.alert(
        'Workout Complete!',
        `Great job! ${exercises.length} exercise(s), ${setsToInsert.length} set(s).`,
        [{ text: 'OK', onPress: () => router.navigate('/(tabs)/dashboard') }]
      )
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const totalVolume = exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0)

  if (!session) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Start Workout</Text>
        <Text style={styles.date}>{today}</Text>

        <View style={styles.startCard}>
          <View style={styles.startIcon}>
            <Ionicons name="barbell" size={iconSize.xl + 16} color={colors.accent} />
          </View>
          <Text style={styles.startTitle}>Ready to train?</Text>
          <Text style={styles.startSub}>Start a new workout session and log your exercises, sets, and reps.</Text>
          <Pressable
            onPress={startSession}
            style={({ pressed }) => [
              styles.startBtn,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Start workout"
          >
            <Ionicons name="play" size={iconSize.sm + 2} color={colors.black} style={{ marginRight: spacing.sm }} />
            <Text style={styles.startBtnText}>Start Workout</Text>
          </Pressable>
        </View>
      </ScrollView>
    )
  }

  if (session.status !== 'active') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Workout Complete</Text>
        <Text style={styles.date}>{today}</Text>

        <View style={styles.startCard}>
          <Ionicons name="checkmark-circle" size={iconSize.xl + 16} color={colors.green} style={{ marginBottom: spacing.md }} />
          <Text style={styles.startTitle}>Session {session.status === 'auto_completed' ? 'Auto-' : ''}Completed</Text>
          <Text style={styles.startSub}>
            {exercises.length} exercises, {totalSets} sets, {Math.round(totalVolume)} kg volume
          </Text>
          {newPRs.length > 0 && (
            <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
              {newPRs.map((pr, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Ionicons name="trophy" size={iconSize.sm} color={colors.green} />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.green }}>
                    PR: {pr.exercise} - {pr.weight}kg x {pr.reps}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.startBtn}
            onPress={() => {
              setSession(null)
              setExercises([])
              setElapsed(0)
              setNewPRs([])
            }}
          >
            <Ionicons name="refresh" size={iconSize.sm + 2} color={colors.black} style={{ marginRight: spacing.sm }} />
            <Text style={styles.startBtnText}>New Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.activeHeader}>
        <View>
          <Text style={styles.title}>Workout In Progress</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.timerPill}>
          <Ionicons name="time-outline" size={iconSize.sm} color={colors.accent} />
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {exercises.length > 0 && (
        <View style={{
          flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg,
        }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>{exercises.length}</Text>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase' }}>Exercises</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>{totalSets}</Text>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase' }}>Sets</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }}>{Math.round(totalVolume)}</Text>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase' }}>Vol kg</Text>
          </View>
        </View>
      )}

      {exercises.map((ex, exIdx) => (
        <View key={exIdx} style={styles.exerciseSection}>
          <View style={styles.exerciseHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              {ex.sets.some(s => s.isPR) && (
                <Text style={styles.exerciseBadge}>PR</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => removeExercise(exIdx)} accessibilityRole="button">
              <Ionicons name="close-circle" size={iconSize.md} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.setsTable}>
            <View style={styles.setsHeader}>
              <Text style={[styles.setHeaderCell, styles.setHeaderSet]}>SET</Text>
              <Text style={[styles.setHeaderCell, styles.setHeaderWeight]}>KG</Text>
              <Text style={[styles.setHeaderCell, styles.setHeaderReps]}>REPS</Text>
              <Text style={[styles.setHeaderCell, styles.setHeaderActions]}>REST</Text>
            </View>

            {ex.sets.map((s, sIdx) => (
              <View key={sIdx} style={[styles.setRow, sIdx < ex.sets.length - 1 && styles.setRowBorder]}>
                <Text style={styles.setNumber}>{s.set_number}</Text>
                <Text style={styles.setWeight}>
                  {s.weight}
                  {s.isPR && <Text style={styles.setPrBadge}>PR</Text>}
                </Text>
                <Text style={styles.setReps}>{s.reps}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  <TouchableOpacity
                    onPress={() => startRestTimer(restPreset)}
                    style={{ padding: spacing.xs }}
                  >
                    <Ionicons name="timer-outline" size={iconSize.sm} color={colors.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeSet(exIdx, sIdx)}
                    style={styles.deleteSetBtn}
                  >
                    <Ionicons name="trash-outline" size={iconSize.sm} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <AddSetRow onAdd={(weight, reps) => addSet(exIdx, weight, reps)} />
        </View>
      ))}

      {showAddExercise ? (
        <View style={{
          backgroundColor: colors.surface, borderRadius: radii.lg,
          padding: spacing.md, borderWidth: 1, borderColor: colors.accent + '60',
          marginBottom: spacing.lg, gap: spacing.sm,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>Add Exercise</Text>
          <TextInput
            style={styles.miniInput}
            placeholder="Exercise name"
            placeholderTextColor={colors.textMuted}
            value={newExerciseName}
            onChangeText={setNewExerciseName}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={() => addExercise(newExerciseName)}
          />
          {recentExercises.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {recentExercises.map(name => (
                <TouchableOpacity
                  key={name}
                  onPress={() => addExercise(name)}
                  style={{
                    backgroundColor: colors.surfaceLight, borderRadius: radii.full,
                    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
                    borderWidth: 1, borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => addExercise(newExerciseName)}
              style={{ flex: 1, backgroundColor: colors.accent, borderRadius: radii.md, paddingVertical: spacing.sm, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.black }}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowAddExercise(false); setNewExerciseName('') }}
              style={{ flex: 1, backgroundColor: colors.surfaceLight, borderRadius: radii.md, paddingVertical: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addExerciseBtn}
          onPress={() => setShowAddExercise(true)}
        >
          <Ionicons name="add-circle-outline" size={iconSize.md} color={colors.accent} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>
      )}

      {exercises.length > 0 && (
        <TouchableOpacity
          style={styles.completeBtn}
          onPress={() => Alert.alert(
            'Complete Workout',
            'Are you sure you want to finish this workout?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Complete', onPress: () => completeSession('completed'), style: 'default' },
            ]
          )}
        >
          <Ionicons name="checkmark-circle" size={iconSize.sm + 2} color={colors.black} style={{ marginRight: spacing.sm }} />
          <Text style={styles.completeBtnText}>Complete Workout</Text>
        </TouchableOpacity>
      )}

      {restTimer && (
        <RestTimerDisplay
          seconds={restSeconds}
          onStop={stopRestTimer}
          onPresetChange={(s) => startRestTimer(s)}
          currentPreset={restPreset}
        />
      )}
    </ScrollView>
  )
}

function AddSetRow({ onAdd }) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const weightRef = useRef(null)
  const repsRef = useRef(null)

  function handleAdd() {
    if (!reps || parseInt(reps) <= 0) return
    onAdd(weight, reps)
    setWeight('')
    setReps('')
    setTimeout(() => repsRef.current?.focus(), 100)
  }

  return (
    <View style={styles.addSetRow}>
      <TextInput
        ref={weightRef}
        style={[styles.miniInput, styles.miniInputWeight]}
        placeholder="Weight kg"
        placeholderTextColor={colors.textMuted}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        returnKeyType="next"
        onSubmitEditing={() => repsRef.current?.focus()}
      />
      <TextInput
        ref={repsRef}
        style={[styles.miniInput, styles.miniInputReps]}
        placeholder="Reps"
        placeholderTextColor={colors.textMuted}
        value={reps}
        onChangeText={setReps}
        keyboardType="number-pad"
        returnKeyType="go"
        onSubmitEditing={handleAdd}
      />
      <TouchableOpacity style={styles.addSetBtn} onPress={handleAdd}>
        <Ionicons name="add" size={iconSize.md} color={colors.black} />
      </TouchableOpacity>
    </View>
  )
}

function RestTimerDisplay({ seconds, onStop, onPresetChange, currentPreset }) {
  const presets = [30, 60, 90, 120, 180]

  return (
    <View style={styles.restTimerOverlay}>
      <View style={styles.restTimerHeader}>
        <Text style={styles.restTimerTitle}>Rest Timer</Text>
        <TouchableOpacity onPress={onStop} style={styles.restTimerClose}>
          <Ionicons name="close-circle" size={iconSize.md} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={styles.restTimerDisplay}>
        <Text style={styles.restTimerBig}>{formatTime(seconds)}</Text>
      </View>
      <View style={styles.restTimerPresets}>
        {presets.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.restPresetBtn, p === currentPreset && styles.restPresetBtnActive]}
            onPress={() => onPresetChange(p)}
          >
            <Text style={[styles.restPresetText, p === currentPreset && styles.restPresetTextActive]}>
              {p}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
