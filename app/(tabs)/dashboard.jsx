import { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { calculateStreak, getCurrentWeekRange, getWeekId } from '../../lib/streak'
import { getBadge, getNextBadge, getProgressToNextBadge } from '../../lib/badges'
import { withTimeout, withRetry } from '../../lib/supabaseHelpers'
import { getDummyWorkouts, getDummyProfile } from '../../lib/seedData'
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
import GlowCircle from '../../components/GlowCircle'
import StreakHero from '../../components/StreakHero'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
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
    marginBottom: spacing.sm,
  },
  errorSub: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md - 2,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  retryBtnText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '800',
  },
  demoPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.orange + '15',
    borderColor: colors.orange + '50',
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.sm + spacing.xs,
  },
  demoPillText: {
    fontSize: 11,
    color: colors.orange,
    fontWeight: '800',
    letterSpacing: letterSpacing.normal,
    textTransform: 'uppercase',
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  greeting: {
    ...typography.h2,
    color: colors.text,
  },
  dateText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl + spacing.md,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md + spacing.xs,
    textAlign: 'center',
  },
  emptyBtn: {
    backgroundColor: colors.accent,
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  emptyBtnText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '800',
  },
  heroWrap: {
    marginBottom: spacing.md,
  },
  badgePillRow: {
    alignItems: 'center',
    marginTop: spacing.sm + spacing.xs,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    gap: spacing.sm,
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
    letterSpacing: letterSpacing.tight,
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
    letterSpacing: letterSpacing.normal,
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
    gap: spacing.sm + 2,
  },
  dayLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dayDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    ...shadows.glow(colors.green),
  },
  dayDotFuture: {
    opacity: 0.25,
  },
  dayLabelFuture: {
    opacity: 0.25,
  },
  progressSection: {
    gap: spacing.sm + 2,
    marginTop: spacing.xs,
  },
  weekProgress: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.tight,
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
  },
  workoutBtn: {
    backgroundColor: colors.accent,
    minHeight: 56,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
    ...shadows.button,
  },
  workoutBtnText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.normal,
  },
  nextBadgeCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextBadgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nextBadgeTitle: {
    ...typography.label,
    color: colors.textSecondary,
  },
  nextBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    gap: spacing.xs + 2,
    backgroundColor: colors.surfaceLight,
  },
  nextBadgeName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: letterSpacing.tight,
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
  const [usingDemoData, setUsingDemoData] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
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
        const result = await withRetry(
          () => withTimeout(
            supabase.from('profiles').select('username, display_name, is_guest').eq('id', user.id).maybeSingle(),
            10000
          ),
          3,
          1000
        )
        if (result.error) {
          console.log('[Dashboard] Profile query error:', result.error.message, result.error.details)
          throw new Error(result.error.message)
        }
        profile = result.data
        console.log('[Dashboard] Profile result:', profile ? 'found' : 'null')
      } catch (e) {
        console.log('[Dashboard] Profile query error/catch:', e?.message || e)
        profile = null
      }

      if (profile) {
        setUsername(profile?.display_name || profile?.username || 'Athlete')
        setIsGuest(!!profile?.is_guest)
      } else {
        console.log('[Dashboard] Using dummy profile')
        const fallback = getDummyProfile()
        setUsername(fallback.display_name)
      }

      console.log('[Dashboard] Fetching completed workout sessions')
      try {
        const result = await withRetry(
          () => withTimeout(
            supabase.from('workout_sessions')
              .select('id, started_at, completed_at, status')
              .eq('user_id', user.id)
              .or('status.eq.completed,status.eq.auto_completed')
              .order('started_at', { ascending: false }),
            10000
          ),
          3,
          1000
        )
        if (result.error) {
          console.log('[Dashboard] Sessions query error:', result.error.message)
          throw new Error(result.error.message)
        }
        workoutData = result.data
        console.log('[Dashboard] Sessions result count:', workoutData?.length ?? 'null')
      } catch (e) {
        console.log('[Dashboard] Sessions query error/catch:', e?.message || e)
        workoutData = null
      }

      setFetchError('')
      const data = workoutData || getDummyWorkouts()
      setUsingDemoData(workoutData === null)
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
    const dateStr = w.completed_at ? new Date(w.completed_at).toISOString().split('T')[0] : new Date(w.started_at).toISOString().split('T')[0]
    if (getWeekId(new Date(dateStr)) === currentWeekId) {
      daysWithWorkouts.add(dateStr)
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
        <Ionicons name="alert-circle-outline" size={iconSize.xl + 20} color={colors.red} style={{ marginBottom: spacing.md }} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSub}>{fetchError}</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryBtn}
          onPress={fetchData}
          accessibilityRole="button"
          accessibilityLabel="Retry loading dashboard"
        >
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {usingDemoData ? (
        <View style={styles.demoPill}>
          <Ionicons name="cloud-offline-outline" size={iconSize.sm - 2} color={colors.orange} />
          <Text style={styles.demoPillText}>Showing demo data</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>Hey, {username}</Text>
          {isGuest && (
            <View style={{ backgroundColor: colors.orange + '20', paddingHorizontal: spacing.xs + 2, paddingVertical: 2, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.orange + '50' }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.orange, textTransform: 'uppercase' }}>Guest</Text>
            </View>
          )}
          {streakData.streak > 0 && <Flame streak={streakData.streak} size={16} />}
        </View>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {(workouts || []).length === 0 ? (
        <View style={styles.emptyState}>
          <GlowCircle size={72} color={colors.accent}>
            <Ionicons name="barbell-outline" size={iconSize.xl + 4} color={colors.accent} />
          </GlowCircle>
          <Text style={styles.emptyTitle}>No workouts yet</Text>
          <Text style={styles.emptySub}>Start your first workout to begin your streak</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.emptyBtn}
            onPress={() => router.navigate('/(tabs)/workout')}
            accessibilityRole="button"
            accessibilityLabel="Log your first workout"
          >
            <Text style={styles.emptyBtnText}>Start First Workout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.heroWrap}>
            <StreakHero
              streak={streakData.streak}
              totalWeeks={streakData.totalCompleteWeeks}
            />
            {badge && (
              <View style={styles.badgePillRow}>
                <View style={[styles.badgePill, { borderColor: badge.color + '60', backgroundColor: badge.color + '12' }]}>
                  <View style={[styles.badgeDot, { backgroundColor: badge.color }]} />
                  <Text style={[styles.badgePillText, { color: badge.color }]}>{badge.label}</Text>
                </View>
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
                        <Ionicons name="checkmark" size={iconSize.md} color={colors.black} />
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

          <Pressable
            onPress={() => router.navigate('/(tabs)/workout')}
            style={({ pressed }) => [
              styles.workoutBtn,
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Log workout"
          >
            <Ionicons name="barbell" size={iconSize.md} color={colors.black} style={{ marginRight: spacing.sm }} />
            <Text style={styles.workoutBtnText}>Start Workout</Text>
          </Pressable>

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
