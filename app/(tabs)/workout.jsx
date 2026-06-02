import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet,
  ScrollView, Alert, Keyboard
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
import Dot from '../../components/Dot'
import PlateCalculator from '../../components/PlateCalculator'

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

  restTimerFloat: {
    position: 'absolute',
    top: 50,
    right: spacing.lg,
    zIndex: 20,
  },
  restTimerFloatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.full,
    ...shadows.glow(colors.accent),
  },
  restTimerFloatText: { fontSize: 16, fontWeight: '900', color: colors.black, fontVariant: ['tabular-nums'] },
  restTimerFloatIcon: { padding: spacing.xs },

  restTimerPanel: {
    position: 'absolute',
    top: 96,
    right: spacing.lg,
    left: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '60',
    ...shadows.glow(colors.accent),
    zIndex: 20,
  },
  restTimerPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  restTimerPanelTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  restTimerPanelClose: { padding: spacing.xs },
  restTimerPanelDisplay: { alignItems: 'center', marginBottom: spacing.md },
  restTimerPanelBig: { fontSize: 56, fontWeight: '900', color: colors.accent, fontVariant: ['tabular-nums'] },
  restTimerPanelPresets: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  restPresetBtn: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restPresetBtnActive: { backgroundColor: colors.accentDim, borderColor: colors.accent + '60' },
  restPresetText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  restPresetTextActive: { color: colors.accent },

  todayStats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  todayStat: { flex: 1, alignItems: 'center' },
  todayStatDivider: { width: 1, backgroundColor: colors.border },
  todayStatNumber: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  todayStatLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: letterSpacing.normal, marginTop: spacing.xs },

  errorBox: {
    backgroundColor: colors.dangerDim,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md + spacing.xs,
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  form: { gap: spacing.md + spacing.xs },
  inputGroup: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm + spacing.xs },
  label: { ...typography.label, color: colors.textSecondary },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  inputFocused: { borderColor: colors.accent, borderWidth: 2 },
  inputError: { borderColor: colors.danger },
  weightInputWrap: { position: 'relative', justifyContent: 'center' },
  weightInput: { paddingRight: 56 },
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
  calcBtnDisabled: { opacity: 0.4 },
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
  recentChipText: { fontSize: 12, color: colors.accent, fontWeight: '700' },

  lastSetHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  lastSetText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  lastSetValue: { fontSize: 12, color: colors.accent, fontWeight: '800' },

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
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.green + '25',
  },
  savedBannerText: { fontSize: 13, color: colors.green, fontWeight: '700' },

  prBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.green + '15',
    borderRadius: radii.md,
    padding: spacing.sm + spacing.xs,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.green + '30',
  },
  prBannerText: { fontSize: 14, color: colors.green, fontWeight: '800' },

  todaysLogSection: { marginTop: spacing.lg },
  todaysLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  todaysLogTitle: { ...typography.label, color: colors.text },

  exerciseGroup: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  exerciseGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseGroupLeft: { flexDirection: 'row', alignItems: 'center' },
  exerciseGroupName: { fontSize: 14, fontWeight: '900', color: colors.text, textTransform: 'uppercase' },
  exerciseGroupPr: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.green,
    backgroundColor: colors.green + '20',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: spacing.sm,
  },
  exerciseGroupSets: { fontSize: 11, color: colors.textMuted, fontWeight: '700', marginRight: spacing.sm },
  addSetInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
  },
  addSetInlineText: { fontSize: 12, fontWeight: '900', color: colors.black, textTransform: 'uppercase' },

  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
  },
  logRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  logInfo: { flex: 1 },
  logSetNum: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  logDetail: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginTop: 2, lineHeight: 18 },
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
  logWeightValue: { color: colors.accent, fontSize: 14, fontWeight: '900' },
  logWeightUnit: { color: colors.accent, fontSize: 10, fontWeight: '800', marginLeft: 2, opacity: 0.8 },
  logPrBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.green,
    backgroundColor: colors.green + '20',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: spacing.xs,
  },

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

  completedCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xl,
  },

  historySection: {
    marginTop: spacing.xl + spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  historyTitle: {
    ...typography.label,
    color: colors.text,
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyCardBorder: {
    marginTop: spacing.sm,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  historyTime: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  historyExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
  },
  historyExerciseBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyExerciseInfo: {
    flex: 1,
  },
  historyExerciseName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  historyExerciseDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  historyEmpty: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
    fontWeight: '600',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md - 2,
    marginTop: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    backgroundColor: colors.accent + '08',
    minHeight: 44,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
  },
})

export default function WorkoutScreen() {
  const { user } = useAuth()
  const router = useRouter()

  const [session, setSession] = useState(null)
  const [exerciseName, setExerciseName] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [recentExercises, setRecentExercises] = useState([])
  const [loggedSets, setLoggedSets] = useState([])
  const [justSaved, setJustSaved] = useState(false)
  const [justPR, setJustPR] = useState(null)
  const [focused, setFocused] = useState(null)
  const [calcOpen, setCalcOpen] = useState(false)
  const [restTimerOpen, setRestTimerOpen] = useState(false)
  const [restSeconds, setRestSeconds] = useState(REST_TIMER_DEFAULT)
  const [restPreset, setRestPreset] = useState(REST_TIMER_DEFAULT)
  const [elapsed, setElapsed] = useState(0)
  const [existingPRs, setExistingPRs] = useState({})
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [hasMoreHistory, setHasMoreHistory] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const HISTORY_PAGE_SIZE = 5

  const timerRef = useRef(null)
  const restRef = useRef(null)
  const inactivityRef = useRef(null)
  const autoWarnRef = useRef(null)
  const repsRef = useRef(null)
  const weightRef = useRef(null)

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
        [{ text: 'Keep Working Out', onPress: () => resetInactivityTimer() }]
      )
    }, AUTO_COMPLETE_MS - 120000)

    inactivityRef.current = setTimeout(async () => {
      await completeSession('auto_completed')
    }, AUTO_COMPLETE_MS)
  }, [session])

  async function startSession() {
    if (!user) return
    const { data, error } = await withTimeout(
      supabase.from('workout_sessions').insert({ user_id: user.id, status: 'active' }).select().single(),
      10000
    )
    if (error) { Alert.alert('Error', error.message); return }
    setSession(data)
    loadRecentExercises()
    loadExistingPRs()
    loadWorkoutHistory(1, false)
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
        const unique = [...new Set(data.map(w => w.exercise_name))].slice(0, 5)
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

  async function loadWorkoutHistory(page = 1, append = false) {
    if (!user || loadingHistory) return
    setLoadingHistory(true)
    try {
      const from = (page - 1) * HISTORY_PAGE_SIZE
      const to = from + HISTORY_PAGE_SIZE - 1
      const { data: sessions, error } = await withTimeout(
        supabase.from('workout_sessions')
          .select('id, started_at, completed_at, status, workout_sets(exercise_name, reps, weight, set_number)')
          .eq('user_id', user.id)
          .in('status', ['completed', 'auto_completed'])
          .order('started_at', { ascending: false })
          .range(from, to),
        10000
      )
      if (error) throw new Error(error.message)
      if (sessions && sessions.length > 0) {
        const formatted = sessions.map(s => ({
          id: s.id,
          date: s.started_at,
          completedAt: s.completed_at,
          exercises: groupSetsByExercise(s.workout_sets || []),
          totalSets: (s.workout_sets || []).length,
          totalVolume: (s.workout_sets || []).reduce((sum, ws) => sum + (ws.weight * ws.reps), 0),
        }))
        setWorkoutHistory(prev => append ? [...prev, ...formatted] : formatted)
        setHasMoreHistory(sessions.length === HISTORY_PAGE_SIZE)
        setHistoryPage(page)
      } else {
        setHasMoreHistory(false)
      }
    } catch (e) {
      console.log('[Workout] History load error:', e?.message || e)
    } finally {
      setLoadingHistory(false)
    }
  }

  function groupSetsByExercise(sets) {
    const map = {}
    sets.forEach(s => {
      if (!map[s.exercise_name]) map[s.exercise_name] = []
      map[s.exercise_name].push(s)
    })
    return Object.entries(map).map(([name, s]) => ({
      name,
      sets: s.length,
      bestWeight: Math.max(...s.map(x => x.weight || 0)),
      bestReps: Math.max(...s.map(x => x.reps || 0)),
    }))
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

  function selectExercise(name) {
    setExerciseName(name)
    setError('')
    setFieldErrors({})
    const lastWeight = getLastWeightForExercise(name)
    if (lastWeight > 0) setWeight(String(lastWeight))
    setTimeout(() => repsRef.current?.focus(), 100)
  }

  function getLastWeightForExercise(name) {
    for (let i = loggedSets.length - 1; i >= 0; i--) {
      if (loggedSets[i].exercise_name === name) return loggedSets[i].weight
    }
    return 0
  }

  function getLastRepsForExercise(name) {
    for (let i = loggedSets.length - 1; i >= 0; i--) {
      if (loggedSets[i].exercise_name === name) return loggedSets[i].reps
    }
    return 0
  }

  function quickAddSet(name) {
    const lastWeight = getLastWeightForExercise(name)
    const lastReps = getLastRepsForExercise(name)
    setExerciseName(name)
    setWeight(lastWeight > 0 ? String(lastWeight) : '')
    setReps(lastReps > 0 ? String(lastReps) : '')
    setTimeout(() => repsRef.current?.focus(), 150)
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

      const w = weight ? parseFloat(weight) : 0
      const r = parseInt(reps)
      const trimmedName = exerciseName.trim()
      const isPR = w > 0 && w > (existingPRs[trimmedName] || 0)

      const newSet = {
        exercise_name: trimmedName,
        reps: r,
        weight: w,
        isPR,
        created_at: new Date().toISOString(),
      }

      setLoggedSets(prev => [...prev, newSet])

      if (isPR) {
        setJustPR({ exercise: trimmedName, weight: w, reps: r })
        setExistingPRs(prev => ({ ...prev, [trimmedName]: w }))
        setTimeout(() => setJustPR(null), 4000)
      }

      setReps('')
      setWeight('')
      setFieldErrors({})
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)

      resetInactivityTimer()
      setTimeout(() => repsRef.current?.focus(), 200)
    } catch (e) {
      setError(e.message || 'An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  function startRestTimer(seconds) {
    setRestPreset(seconds)
    setRestSeconds(seconds)
    setRestTimerOpen(true)
    if (restRef.current) clearInterval(restRef.current)
    restRef.current = setInterval(() => {
      setRestSeconds(prev => {
        if (prev <= 1) {
          clearInterval(restRef.current)
          setRestTimerOpen(false)
          Alert.alert('Rest Complete', 'Time to go again!')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function stopRestTimer() {
    if (restRef.current) clearInterval(restRef.current)
    setRestTimerOpen(false)
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

    const setsToInsert = loggedSets.map((s, i) => ({
      session_id: session.id,
      user_id: user.id,
      exercise_name: s.exercise_name,
      reps: s.reps,
      weight: s.weight,
      set_number: i + 1,
    }))

    if (setsToInsert.length > 0) {
      await withTimeout(supabase.from('workout_sets').insert(setsToInsert), 10000)
    }

    setSession(prev => prev ? { ...prev, status } : null)
    if (status === 'completed') {
      const exercises = [...new Set(loggedSets.map(s => s.exercise_name))]
      Alert.alert(
        'Workout Complete!',
        `${exercises.length} exercise(s), ${loggedSets.length} set(s).`,
        [{ text: 'OK', onPress: () => router.navigate('/(tabs)/dashboard') }]
      )
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const groupedExercises = useMemo(() => {
    const map = {}
    loggedSets.forEach((s, i) => {
      if (!map[s.exercise_name]) map[s.exercise_name] = []
      map[s.exercise_name].push({ ...s, globalIndex: i })
    })
    return Object.entries(map)
  }, [loggedSets])

  const todayStats = useMemo(() => {
    const sets = loggedSets.length
    const totalReps = loggedSets.reduce((sum, s) => sum + s.reps, 0)
    const volume = loggedSets.reduce((sum, s) => sum + s.weight * s.reps, 0)
    return { sets, reps: totalReps, volume }
  }, [loggedSets])

  const lastSetForCurrentExercise = useMemo(() => {
    if (!exerciseName.trim()) return null
    return loggedSets.filter(s => s.exercise_name === exerciseName.trim()).pop() || null
  }, [loggedSets, exerciseName])

  const weightNum = parseFloat(weight)
  const calcEnabled = !isNaN(weightNum) && weightNum > 0

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
          <Text style={styles.startSub}>Start a session, log your exercises like your notebook. Each set saved builds your workout.</Text>
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
    const exercises = [...new Set(loggedSets.map(s => s.exercise_name))]
    const totalVolume = loggedSets.reduce((sum, s) => sum + s.weight * s.reps, 0)
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Workout Complete</Text>
        <Text style={styles.date}>{today}</Text>

        <View style={styles.completedCard}>
          <Ionicons name="checkmark-circle" size={iconSize.xl + 16} color={colors.green} style={{ marginBottom: spacing.md }} />
          <Text style={styles.startTitle}>Session {session.status === 'auto_completed' ? 'Auto-' : ''}Completed</Text>
          <Text style={styles.startSub}>
            {exercises.length} exercise(s), {loggedSets.length} set(s), {Math.round(totalVolume)} kg volume
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.startBtn}
            onPress={() => { setSession(null); setLoggedSets([]); setElapsed(0); setExistingPRs({}); setExerciseName('') }}
          >
            <Ionicons name="refresh" size={iconSize.sm + 2} color={colors.black} style={{ marginRight: spacing.sm }} />
            <Text style={styles.startBtnText}>New Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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

        {loggedSets.length > 0 ? (
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
              autoFocus={!exerciseName}
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

          {lastSetForCurrentExercise ? (
            <View style={styles.lastSetHint}>
              <Ionicons name="arrow-back-outline" size={iconSize.sm - 4} color={colors.textMuted} />
              <Text style={styles.lastSetText}>Last:</Text>
              <Text style={styles.lastSetValue}>{lastSetForCurrentExercise.weight}kg x {lastSetForCurrentExercise.reps} reps</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              saving && { opacity: 0.6 },
              pressed && !saving && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add set"
          >
            <Ionicons name="add-circle" size={iconSize.sm + 2} color={colors.black} style={{ marginRight: spacing.sm }} />
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Add Set'}</Text>
          </Pressable>
        </View>

        {justSaved ? (
          <View style={styles.savedBanner} accessibilityLiveRegion="polite">
            <Ionicons name="checkmark-circle" size={iconSize.sm} color={colors.green} />
            <Text style={styles.savedBannerText}>Set logged! Change weight/reps and tap again for next set.</Text>
          </View>
        ) : null}

        {justPR ? (
          <View style={styles.prBanner} accessibilityLiveRegion="polite">
            <Ionicons name="trophy" size={iconSize.sm + 2} color={colors.green} />
            <Text style={styles.prBannerText}>
              New PR! {justPR.exercise} -- {justPR.weight}kg x {justPR.reps}
            </Text>
          </View>
        ) : null}

        {groupedExercises.length > 0 ? (
          <View style={styles.todaysLogSection}>
            <View style={styles.todaysLogHeader}>
              <Ionicons name="book-outline" size={iconSize.sm} color={colors.textSecondary} />
              <Text style={styles.todaysLogTitle}>Session Log ({loggedSets.length} sets)</Text>
            </View>

            {groupedExercises.map(([name, sets]) => {
              const hasPR = sets.some(s => s.isPR)
              return (
                <View key={name} style={styles.exerciseGroup}>
                  <View style={styles.exerciseGroupHeader}>
                    <View style={styles.exerciseGroupLeft}>
                      <Text style={styles.exerciseGroupName}>{name}</Text>
                      {hasPR && <Text style={styles.exerciseGroupPr}>PR</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.exerciseGroupSets}>{sets.length} set(s)</Text>
                      <TouchableOpacity
                        style={styles.addSetInlineBtn}
                        onPress={() => quickAddSet(name)}
                      >
                        <Ionicons name="add" size={iconSize.sm - 4} color={colors.black} />
                        <Text style={styles.addSetInlineText}>Add Set</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {sets.map((s, i) => (
                    <View key={s.globalIndex} style={[styles.logRow, i < sets.length - 1 && styles.logRowBorder]}>
                      <Dot size={10} filled color={s.isPR ? colors.green : colors.accent} />
                      <View style={styles.logInfo}>
                        <Text style={styles.logSetNum}>Set {i + 1}</Text>
                        <Text style={styles.logDetail}>{s.reps} reps</Text>
                      </View>
                      {s.weight > 0 ? (
                        <View style={styles.logWeightChip}>
                          <Text style={styles.logWeightValue}>{s.weight}</Text>
                          <Text style={styles.logWeightUnit}>KG</Text>
                          {s.isPR && <Text style={styles.logPrBadge}>PR</Text>}
                        </View>
                      ) : (
                        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '800' }}>x{s.reps}</Text>
                      )}
                      <TouchableOpacity
                        onPress={() => startRestTimer(restPreset)}
                        style={{ padding: spacing.xs }}
                      >
                        <Ionicons name="timer-outline" size={iconSize.sm} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xxl, paddingVertical: spacing.lg }}>
            <Ionicons name="book-outline" size={iconSize.md} color={colors.textMuted} />
            <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '700' }}>Your sets will appear here -- like your notebook</Text>
          </View>
        )}

        {loggedSets.length > 0 && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => Alert.alert(
              'Complete Workout',
              'Are you sure you want to finish this workout?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Complete', onPress: () => completeSession('completed') },
              ]
            )}
          >
            <Ionicons name="checkmark-circle" size={iconSize.sm + 2} color={colors.black} style={{ marginRight: spacing.sm }} />
            <Text style={styles.completeBtnText}>Complete Workout</Text>
          </TouchableOpacity>
        )}

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Ionicons name="calendar-outline" size={iconSize.sm} color={colors.textSecondary} />
            <Text style={styles.historyTitle}>Recent Workouts</Text>
          </View>

          {workoutHistory.map((wh, idx) => {
            const d = new Date(wh.date)
            const isToday = d.toDateString() === new Date().toDateString()
            const isYesterday = d.toDateString() === new Date(Date.now() - 86400000).toDateString()
            const dateLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            const timeLabel = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

            return (
              <View key={wh.id} style={[styles.historyCard, idx > 0 && styles.historyCardBorder]}>
                <View style={styles.historyCardHeader}>
                  <View>
                    <Text style={styles.historyDate}>{dateLabel}</Text>
                    <Text style={styles.historyTime}>{timeLabel} -- {wh.totalSets} sets, {Math.round(wh.totalVolume)} kg</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={iconSize.md} color={colors.green} />
                </View>
                {wh.exercises.map((ex, exIdx) => (
                  <View key={ex.name} style={[styles.historyExerciseRow, exIdx < wh.exercises.length - 1 && styles.historyExerciseBorder]}>
                    <View style={styles.historyExerciseInfo}>
                      <Text style={styles.historyExerciseName}>{ex.name}</Text>
                      <Text style={styles.historyExerciseDetail}>{ex.sets} set(s) -- best {ex.bestWeight > 0 ? `${ex.bestWeight}kg` : `${ex.bestReps} reps`}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )
          })}

          {workoutHistory.length === 0 && !loadingHistory && (
            <Text style={styles.historyEmpty}>No past workouts yet. Complete your first workout to see history here.</Text>
          )}

          {hasMoreHistory && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.loadMoreBtn, loadingHistory && { opacity: 0.5 }]}
              onPress={() => loadWorkoutHistory(historyPage + 1, true)}
              disabled={loadingHistory}
            >
              {loadingHistory ? (
                <>
                  <Ionicons name="hourglass-outline" size={iconSize.sm - 2} color={colors.accent} style={{ marginRight: spacing.xs }} />
                  <Text style={styles.loadMoreText}>Loading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="chevron-down" size={iconSize.sm - 2} color={colors.accent} style={{ marginRight: spacing.xs }} />
                  <Text style={styles.loadMoreText}>Load More</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {restTimerOpen ? (
        <View style={styles.restTimerPanel}>
          <View style={styles.restTimerPanelHeader}>
            <Text style={styles.restTimerPanelTitle}>Rest Timer</Text>
            <TouchableOpacity onPress={stopRestTimer} style={styles.restTimerPanelClose}>
              <Ionicons name="close-circle" size={iconSize.md} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.restTimerPanelDisplay}>
            <Text style={styles.restTimerPanelBig}>{formatTime(restSeconds)}</Text>
          </View>
          <View style={styles.restTimerPanelPresets}>
            {[30, 60, 90, 120, 180].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.restPresetBtn, p === restPreset && styles.restPresetBtnActive]}
                onPress={() => startRestTimer(p)}
              >
                <Text style={[styles.restPresetText, p === restPreset && styles.restPresetTextActive]}>{p}s</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.restTimerFloat}
          onPress={() => startRestTimer(restPreset)}
        >
          <View style={styles.restTimerFloatPill}>
            <Ionicons name="timer" size={iconSize.sm} color={colors.black} />
            <Text style={styles.restTimerFloatText}>{restPreset}s</Text>
          </View>
        </TouchableOpacity>
      )}

      <PlateCalculator
        visible={calcOpen}
        onClose={() => setCalcOpen(false)}
        totalWeight={weight}
      />
    </View>
  )
}
