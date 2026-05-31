import { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { calculateStreak, getCurrentWeekRange, getWeekId } from '../../lib/streak'
import { getBadge, getNextBadge, getProgressToNextBadge } from '../../lib/badges'
import { withTimeout } from '../../lib/supabaseHelpers'
import { getDummyWorkouts, getDummyProfile } from '../../lib/seedData'
import { colors, spacing, radii } from '../../constants/theme'
import Flame from '../../components/Flame'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
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
  errorContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryBtnText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '800',
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: radii.lg,
  },
  emptyBtnText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '800',
  },
  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  streakNumber: {
    fontSize: 84,
    fontWeight: '950',
    color: colors.accent,
    lineHeight: 84,
    marginTop: 16,
    letterSpacing: -2,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  streakSub: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
    marginBottom: 4,
  },
  streakMini: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
    fontWeight: '600',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    gap: 8,
    backgroundColor: colors.surfaceLight,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgePillText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  weekCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  weekRange: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  dayCol: {
    alignItems: 'center',
    gap: 10,
  },
  dayLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dayDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotToday: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: colors.surfaceLight,
  },
  dayDotComplete: {
    backgroundColor: colors.green,
    borderColor: colors.green,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  dayDotFuture: {
    opacity: 0.25,
  },
  dayLabelFuture: {
    opacity: 0.25,
  },
  progressSection: {
    gap: 10,
    marginTop: 4,
  },
  weekProgress: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.surfaceLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: 5,
    shadowColor: colors.green,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  workoutBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  workoutBtnText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextBadgeCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  nextBadgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nextBadgeTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    gap: 6,
    backgroundColor: colors.surfaceLight,
  },
  nextBadgeName: {
    fontSize: 12,
    fontWeight: '850',
    letterSpacing: 0.5,
  },
  nextBadgeProgress: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
})

export default function DashboardScreen() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState(null)
  const [streakData, setStreakData] = useState({ streak: 0, totalCompleteWeeks: 0, currentWeekDays: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const [username, setUsername] = useState('')
  const [initialLoad, setInitialLoad] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [badge, setBadge] = useState(null)
  const [nextBadge, setNextBadge] = useState(null)
  const [badgeProgress, setBadgeProgress] = useState(0)
  const router = useRouter()

  async function fetchData() {
    try {
      console.log('[Dashboard] fetchData start')
      if (!user) {
        console.log('[Dashboard] No user')
        setFetchError('Session expired. Please log in again.')
        return
      }

      let profile, workoutData

      console.log('[Dashboard] Fetching profile for user:', user.id)
      try {
        const result = await withTimeout(
          supabase.from('profiles').select('username, display_name').eq('id', user.id).maybeSingle(),
          10000
        )
        profile = result.data
        console.log('[Dashboard] Profile result:', profile ? 'found' : 'null')
      } catch (e) {
        console.log('[Dashboard] Profile query error/catch:', e?.message || e)
        profile = null
      }

      if (profile) {
        setUsername(profile?.display_name || profile?.username || 'Athlete')
      } else {
        console.log('[Dashboard] Using dummy profile')
        const fallback = getDummyProfile()
        setUsername(fallback.display_name)
      }

      console.log('[Dashboard] Fetching workouts')
      try {
        const result = await withTimeout(
          supabase.from('workouts').select('date').eq('user_id', user.id).order('date', { ascending: false }),
          10000
        )
        workoutData = result.data
        console.log('[Dashboard] Workouts result count:', workoutData?.length ?? 'null')
      } catch (e) {
        console.log('[Dashboard] Workouts query error/catch:', e?.message || e)
        workoutData = null
      }

      setFetchError('')
      const data = workoutData || getDummyWorkouts()
      console.log('[Dashboard] Data source:', workoutData ? 'supabase' : 'dummy', 'count:', data.length)
      setWorkouts(data)

      const sd = calculateStreak(data, 3)
      console.log('[Dashboard] Streak:', JSON.stringify(sd))
      setStreakData(sd)

      try {
        const b = await getBadge(sd.totalCompleteWeeks)
        const n = await getNextBadge(sd.totalCompleteWeeks)
        const p = await getProgressToNextBadge(sd.totalCompleteWeeks)
        setBadge(b)
        setNextBadge(n)
        setBadgeProgress(p.progress)
      } catch (e) {
        console.log('[Dashboard] Badge error:', e?.message || e)
      }
    } catch (e) {
      console.log('[Dashboard] Outer catch:', e?.message || e)
      setFetchError(e.message || 'An unexpected error occurred')
    } finally {
      console.log('[Dashboard] fetchData complete, setting initialLoad=false')
      setInitialLoad(false)
    }
  }

  useEffect(() => {
    if (!user) return
    console.log('[Dashboard] useEffect mount, user:', user.id)
    fetchData()
    const safetyTimer = setTimeout(() => {
      console.log('[Dashboard] safety timeout - forcing initialLoad=false')
      setInitialLoad(false)
    }, 20000)
    return () => clearTimeout(safetyTimer)
  }, [user])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [])

  const { start, end } = getCurrentWeekRange()
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date().toISOString().split('T')[0]
  const currentWeekId = getWeekId()

  const daysWithWorkouts = new Set()
  ;(workouts || []).forEach(w => {
    if (getWeekId(new Date(w.date)) === currentWeekId) {
      daysWithWorkouts.add(new Date(w.date).toISOString().split('T')[0])
    }
  })

  if (initialLoad && workouts === null) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingPulse} />
        <View style={[styles.loadingPulse, { width: '60%', marginTop: 12 }]} />
        <View style={[styles.loadingPulse, { width: '40%', marginTop: 8 }]} />
      </View>
    )
  }

  if (fetchError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.red} style={{ marginBottom: 16 }} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSub}>{fetchError}</Text>
        <TouchableOpacity activeOpacity={0.8} style={styles.retryBtn} onPress={fetchData}>
          <Ionicons name="refresh-outline" size={18} color={colors.black} style={{ marginRight: 8 }} />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>Hey, {username}</Text>
          {streakData.streak > 0 && <Flame streak={streakData.streak} size={16} />}
        </View>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {(workouts || []).length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptySub}>Log your first workout to start your streak</Text>
          <TouchableOpacity activeOpacity={0.8} style={styles.emptyBtn} onPress={() => router.navigate('/(tabs)/workout')}>
            <Text style={styles.emptyBtnText}>Log First Workout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.streakCard}>
            <Flame streak={streakData.streak} size={36} />
            <Text style={styles.streakNumber}>{streakData.streak}</Text>
            <Text style={styles.streakSub}>week streak</Text>
            <Text style={styles.streakMini}>{streakData.totalCompleteWeeks} total weeks completed</Text>

            {badge && (
              <View style={[styles.badgePill, { borderColor: badge.color + '60', backgroundColor: badge.color + '12' }]}>
                <View style={[styles.badgeDot, { backgroundColor: badge.color }]} />
                <Text style={[styles.badgePillText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            )}
          </View>

          <View style={styles.weekCard}>
            <View style={styles.weekCardHeader}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <Text style={styles.weekRange}>
                {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>

            <View style={styles.weekGrid}>
              {weekDays.map((day, i) => {
                const date = new Date(start)
                date.setDate(start.getDate() + i)
                const dateStr = date.toISOString().split('T')[0]
                const isToday = dateStr === today
                const isPast = dateStr < today
                const isComplete = daysWithWorkouts.has(dateStr)

                return (
                  <View key={day} style={styles.dayCol}>
                    <View style={[
                      styles.dayDot,
                      isToday && styles.dayDotToday,
                      isComplete && styles.dayDotComplete,
                      !isPast && !isToday && styles.dayDotFuture,
                    ]}>
                      {isComplete ? (
                        <Ionicons name="checkmark" size={18} color={colors.black} />
                      ) : isToday && !isComplete ? (
                        <Ionicons name="ellipse" size={6} color={colors.accent} />
                      ) : null}
                    </View>
                    <Text style={[
                      styles.dayLabel,
                      isComplete && { color: colors.green },
                      isToday && !isComplete && { color: colors.accent },
                      !isPast && !isToday && styles.dayLabelFuture,
                    ]}>
                      {day}
                    </Text>
                  </View>
                )
              })}
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.weekProgress}>
                {streakData.currentWeekDays} of 3 days
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min((streakData.currentWeekDays / 3) * 100, 100)}%` }]} />
              </View>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.workoutBtn} onPress={() => router.navigate('/(tabs)/workout')}>
            <Ionicons name="barbell" size={20} color={colors.black} style={{ marginRight: 8 }} />
            <Text style={styles.workoutBtnText}>Log Workout</Text>
          </TouchableOpacity>

          {nextBadge && (
            <View style={styles.nextBadgeCard}>
              <View style={styles.nextBadgeHeader}>
                <Text style={styles.nextBadgeTitle}>Next Badge</Text>
                <View style={[styles.nextBadgePill, { borderColor: nextBadge.color + '60', backgroundColor: nextBadge.color + '12' }]}>
                  <View style={[styles.badgeDot, { backgroundColor: nextBadge.color }]} />
                  <Text style={[styles.nextBadgeName, { color: nextBadge.color }]}>{nextBadge.label}</Text>
                </View>
              </View>
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${badgeProgress * 100}%`, backgroundColor: nextBadge.color }]} />
                </View>
                <Text style={styles.nextBadgeProgress}>
                  {streakData.totalCompleteWeeks} / {nextBadge.weeks} weeks
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}
