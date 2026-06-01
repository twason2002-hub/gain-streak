import { useEffect, useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { calculateStreak, getWeekId } from '../../lib/streak'
import { withTimeout } from '../../lib/supabaseHelpers'
import { getDummyWorkouts } from '../../lib/seedData'
import { calculatePRs, getTopPRs, getExerciseIcon } from '../../lib/prs'
import { ensureExerciseTypes } from '../../lib/config'
import {
  colors,
  spacing,
  radii,
  typography,
  letterSpacing,
  shadows,
  iconSize,
} from '../../constants/theme'
import Flame from '../../components/Flame'
import Dot from '../../components/Dot'
import GlowCircle from '../../components/GlowCircle'

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: spacing.lg },
  loadingPulse: { height: 16, backgroundColor: colors.surfaceLight, borderRadius: 8, marginTop: 6 },
  errorContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  errorTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  errorSub: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.accent, paddingHorizontal: spacing.xl, paddingVertical: spacing.md - 2, borderRadius: radii.lg, flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  retryBtnText: { color: colors.black, fontSize: 16, fontWeight: '800' },
  demoPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, backgroundColor: colors.orange + '15', borderColor: colors.orange + '50', borderWidth: 1, borderRadius: radii.full, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2, marginBottom: spacing.sm + spacing.xs },
  demoPillText: { fontSize: 11, color: colors.orange, fontWeight: '800', letterSpacing: letterSpacing.normal, textTransform: 'uppercase' },
  title: { ...typography.h2, color: colors.text, textTransform: 'uppercase' },
  subtitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.lg, marginTop: spacing.xs },

  summaryCard: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  summaryTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryFlameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  summaryNumber: { fontSize: 44, fontWeight: '900', lineHeight: 50, color: colors.accent, textShadowColor: colors.accentGlow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18 },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: letterSpacing.tight },
  summaryDivider: { width: 1, height: 40, backgroundColor: colors.border },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { ...typography.label, color: colors.text },
  sectionCount: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },

  exerciseCard: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, overflow: 'hidden' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  exerciseIcon: { width: 40, height: 40, borderRadius: radii.md - 2, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm + spacing.xs, backgroundColor: colors.accentDim },
  exerciseIconText: { fontSize: 14, fontWeight: '900', color: colors.accent },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '800', color: colors.text },
  exerciseDetail: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  exercisePr: { fontSize: 14, fontWeight: '900', color: colors.green, marginRight: spacing.sm },
  exerciseArrow: { padding: spacing.xs },

  weeklyCard: { backgroundColor: colors.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.lg },
  weekRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  weekRowCurrent: { backgroundColor: colors.accentDim },
  weekRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  weekLabelArea: { width: 90 },
  weekLabel: { fontSize: 14, color: colors.text, fontWeight: '800' },
  weekThisLabel: { fontSize: 9, color: colors.accent, fontWeight: '900', textTransform: 'uppercase', letterSpacing: letterSpacing.normal, marginTop: 2 },
  weekBar: { flex: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  weekCount: { width: 36, textAlign: 'right', fontSize: 14, color: colors.textSecondary, fontWeight: '800' },

  emptyState: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.md },
  emptyText: { fontSize: 16, color: colors.textMuted, fontWeight: '800' },
  emptySub: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
})

export default function ProgressScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [workouts, setWorkouts] = useState(null)
  const [streakData, setStreakData] = useState({ streak: 0, totalCompleteWeeks: 0, currentWeekDays: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [usingDemoData, setUsingDemoData] = useState(false)
  const [exerciseTypes, setExerciseTypes] = useState([])

  async function fetchData() {
    try {
      if (!user) { setFetchError('Session expired. Please log in again.'); return }

      let data
      try {
        const result = await withTimeout(
          supabase.from('workout_sets').select('exercise_name, reps, weight, created_at')
            .eq('user_id', user.id).order('created_at', { ascending: false }),
          10000
        )
        data = result.data
      } catch { data = null }

      const ws = data || getDummyWorkouts()
      setUsingDemoData(data === null)
      setFetchError('')
      setWorkouts(ws)
      setStreakData(calculateStreak(ws, 3))

      try {
        const types = await ensureExerciseTypes()
        setExerciseTypes(types)
      } catch {}
    } catch (e) {
      setFetchError(e.message || 'An unexpected error occurred')
    } finally {
      setInitialLoad(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchData()
    const safetyTimer = setTimeout(() => setInitialLoad(false), 20000)
    return () => clearTimeout(safetyTimer)
  }, [user])

  const prData = useMemo(() => calculatePRs(workouts), [workouts])

  const weeklyMap = {}
  ;(workouts || []).forEach(w => {
    const weekId = getWeekId(new Date(w.created_at || w.date))
    if (!weeklyMap[weekId]) weeklyMap[weekId] = new Set()
    weeklyMap[weekId].add(new Date(w.created_at || w.date).toISOString().split('T')[0])
  })

  const sortedWeeks = Object.entries(weeklyMap)
    .map(([weekId, days]) => ({ weekId, days: days.size }))
    .sort((a, b) => b.weekId.localeCompare(a.weekId))
    .slice(0, 12)

  const currentWeekId = getWeekId()

  if (initialLoad && workouts === null) {
    return (
      <View style={styles.loadingContainer}>
        <View style={[styles.loadingPulse, { width: '50%' }]} />
        <View style={[styles.loadingPulse, { width: '30%', marginTop: 8 }]} />
        <View style={[styles.loadingPulse, { width: '100%', marginTop: 24, height: 200 }]} />
      </View>
    )
  }

  if (fetchError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={iconSize.xl + 20} color={colors.red} style={{ marginBottom: spacing.md }} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSub}>{fetchError}</Text>
        <TouchableOpacity activeOpacity={0.85} style={styles.retryBtn} onPress={fetchData}>
          <Ionicons name="refresh-outline" size={iconSize.sm + 2} color={colors.black} style={{ marginRight: spacing.sm }} />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchData(); setRefreshing(false) }} tintColor={colors.accent} />
      }
    >
      {usingDemoData ? (
        <View style={styles.demoPill}>
          <Ionicons name="cloud-offline-outline" size={iconSize.sm - 2} color={colors.orange} />
          <Text style={styles.demoPillText}>Showing demo data</Text>
        </View>
      ) : null}

      <Text style={styles.title}>Progress</Text>

      {prData.exercises.length > 0 && (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryFlameRow}>
                  <Flame streak={streakData.streak} size={16} />
                  <Text style={[styles.summaryNumber, { marginLeft: spacing.xs + 2 }]}>{streakData.streak}</Text>
                </View>
                <Text style={styles.summaryLabel}>Week streak</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{streakData.totalCompleteWeeks}</Text>
                <Text style={styles.summaryLabel}>Total weeks</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <Text style={styles.sectionCount}>{prData.exercises.length}</Text>
          </View>

          {prData.exercises.map((ex) => {
            const icon = getExerciseIcon(ex.name, exerciseTypes)
            return (
              <TouchableOpacity
                key={ex.name}
                style={styles.exerciseCard}
                onPress={() => router.push({ pathname: '/exercise-chart', params: { exercise: ex.name } })}
              >
                <View style={styles.exerciseRow}>
                  <View style={styles.exerciseIcon}>
                    <Text style={styles.exerciseIconText}>{icon}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseDetail}>
                      {ex.totalSets} sets / Best: {ex.bestWeight.value > 0 ? `${ex.bestWeight.value}kg x ${ex.bestWeight.reps}` : `${ex.bestVolume.reps} reps`}
                    </Text>
                  </View>
                  {ex.bestWeight.value > 0 && (
                    <Text style={styles.exercisePr}>{ex.bestWeight.value}kg</Text>
                  )}
                  <Ionicons name="chevron-forward" size={iconSize.sm} color={colors.textMuted} style={styles.exerciseArrow} />
                </View>
              </TouchableOpacity>
            )
          })}
        </>
      )}

      {sortedWeeks.length > 0 && (
        <>
          <Text style={[styles.subtitle, { marginTop: spacing.lg }]}>
            Last {sortedWeeks.length} weeks
          </Text>
          <View style={styles.weeklyCard}>
            {sortedWeeks.map(({ weekId, days }, index) => {
              const isCurrent = weekId === currentWeekId
              return (
                <View key={weekId} style={[
                  styles.weekRow,
                  isCurrent && styles.weekRowCurrent,
                  index < sortedWeeks.length - 1 && styles.weekRowBorder,
                ]}>
                  <View style={styles.weekLabelArea}>
                    <Text style={[styles.weekLabel, isCurrent && { color: colors.accent }]}>
                      {formatWeekLabel(weekId)}
                    </Text>
                    {isCurrent && <Text style={styles.weekThisLabel}>This week</Text>}
                  </View>
                  <View style={styles.weekBar}>
                    {[1, 2, 3].map(d => (
                      <Dot key={d} size={24} filled={d <= days} color={colors.green} />
                    ))}
                  </View>
                  <Text style={[styles.weekCount, days >= 3 ? { color: colors.green } : {}]}>
                    {days}/3
                  </Text>
                </View>
              )
            })}
          </View>
        </>
      )}

      {prData.exercises.length === 0 && sortedWeeks.length === 0 && (
        <View style={styles.emptyState}>
          <GlowCircle size={64} color={colors.accent}>
            <Ionicons name="analytics-outline" size={iconSize.xl} color={colors.accent} />
          </GlowCircle>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySub}>Start a workout to see your progress</Text>
        </View>
      )}
    </ScrollView>
  )
}

function formatWeekLabel(weekId) {
  const d = new Date(weekId + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
