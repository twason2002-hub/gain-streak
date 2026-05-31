import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { calculateStreak, getWeekId } from '../../lib/streak'
import { withTimeout } from '../../lib/supabaseHelpers'
import { getDummyWorkouts } from '../../lib/seedData'
import { colors, spacing, radii } from '../../constants/theme'
import Flame from '../../components/Flame'

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
    padding: spacing.lg,
  },
  loadingPulse: {
    height: 16,
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
  title: {
    fontSize: 28,
    fontWeight: '950',
    color: colors.text,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.lg,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  weekRowCurrent: {
    backgroundColor: colors.accentDim,
  },
  weekRowBorder: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  weekLabelArea: {
    width: 90,
  },
  weekLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '800',
  },
  weekThisLabel: {
    fontSize: 9,
    color: colors.accent,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  weekBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  weekDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  weekDotEmpty: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
  },
  weekCount: {
    width: 36,
    textAlign: 'right',
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryFlameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryNumber: {
    fontSize: 44,
    fontWeight: '950',
    color: colors.accent,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
})

export default function ProgressScreen() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState(null)
  const [streakData, setStreakData] = useState({ streak: 0, totalCompleteWeeks: 0, currentWeekDays: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [fetchError, setFetchError] = useState('')

  async function fetchData() {
    try {
      console.log('[Progress] fetchData start')
      if (!user) { console.log('[Progress] No user'); setFetchError('Session expired. Please log in again.'); return }

      let data
      console.log('[Progress] Fetching workouts')
      try {
        const result = await withTimeout(
          supabase.from('workouts').select('date').eq('user_id', user.id).order('date', { ascending: false }),
          10000
        )
        data = result.data
        console.log('[Progress] Workouts count:', data?.length ?? 'null')
      } catch (e) {
        console.log('[Progress] Workouts error:', e?.message || e)
        data = null
      }

      const workouts = data || getDummyWorkouts()
      console.log('[Progress] Data source:', data ? 'supabase' : 'dummy')
      setFetchError('')
      setWorkouts(workouts)
      setStreakData(calculateStreak(workouts, 3))
    } catch (e) {
      console.log('[Progress] Outer catch:', e?.message || e)
      setFetchError(e.message || 'An unexpected error occurred')
    } finally {
      console.log('[Progress] fetchData complete')
      setInitialLoad(false)
    }
  }

  useEffect(() => {
    if (!user) return
    console.log('[Progress] useEffect mount, user:', user.id)
    fetchData()
    const safetyTimer = setTimeout(() => {
      console.log('[Progress] safety timeout - forcing initialLoad=false')
      setInitialLoad(false)
    }, 20000)
    return () => clearTimeout(safetyTimer)
  }, [user])

  const weeklyMap = {}
  ;(workouts || []).forEach(w => {
    const weekId = getWeekId(new Date(w.date))
    if (!weeklyMap[weekId]) weeklyMap[weekId] = new Set()
    weeklyMap[weekId].add(new Date(w.date).toISOString().split('T')[0])
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchData(); setRefreshing(false) }} tintColor={colors.accent} />
      }
    >
      <Text style={styles.title}>Progress</Text>
      {sortedWeeks.length > 0 ? (
        <Text style={styles.subtitle}>Last {sortedWeeks.length} weeks</Text>
      ) : null}

      <View style={styles.card}>
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
                  <View
                    key={d}
                    style={[
                      styles.weekDot,
                      d <= days ? { backgroundColor: colors.green, borderColor: colors.green } : styles.weekDotEmpty,
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.weekCount, days >= 3 ? { color: colors.green } : {}]}>
                {days}/3
              </Text>
            </View>
          )
        })}

        {sortedWeeks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySub}>Log your first workout to start tracking</Text>
          </View>
        )}
      </View>

      {sortedWeeks.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryFlameRow}>
                <Flame streak={streakData.streak} size={16} />
                <Text style={[styles.summaryNumber, { marginLeft: 6 }]}>{streakData.streak}</Text>
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
      )}
    </ScrollView>
  )
}

function formatWeekLabel(weekId) {
  const d = new Date(weekId + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
