import { useEffect, useState, useMemo, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { calculateStreak } from '../../lib/streak'
import { getBadge, getNextBadge, getProgressToNextBadge } from '../../lib/badges'
import { calculatePRs, getTopPRs, getExerciseIcon } from '../../lib/prs'
import { ensureExerciseTypes } from '../../lib/config'
import { withTimeout } from '../../lib/supabaseHelpers'
import { getDummyProfile, getDummyWorkouts } from '../../lib/seedData'
import { colors, spacing, radii } from '../../constants/theme'
import Flame from '../../components/Flame'

export default function ProfileScreen() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [workouts, setWorkouts] = useState([])
  const [streakData, setStreakData] = useState({ streak: 0, totalCompleteWeeks: 0, currentWeekDays: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const [exerciseTypes, setExerciseTypes] = useState([])
  const [currentBadge, setCurrentBadge] = useState(null)
  const [nextBadge, setNextBadge] = useState(null)
  const [badgeProgress, setBadgeProgress] = useState(0)
  const [fetchError, setFetchError] = useState('')
  const [initialLoad, setInitialLoad] = useState(true)
  const router = useRouter()

  async function fetchData() {
    try {
      console.log('[Profile] fetchData start')
      if (!user) { console.log('[Profile] No user'); setFetchError('Session expired. Please log in again.'); return }

      let profileData, workoutData

      console.log('[Profile] Fetching profile')
      try {
        const result = await withTimeout(
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          10000
        )
        profileData = result.data
        console.log('[Profile] Profile:', profileData ? 'found' : 'null')
      } catch (e) {
        console.log('[Profile] Profile error:', e?.message || e)
        profileData = null
      }

      console.log('[Profile] Fetching workouts')
      try {
        const result = await withTimeout(
          supabase.from('workouts').select('*').eq('user_id', user.id).order('date', { ascending: false }),
          10000
        )
        workoutData = result.data
        console.log('[Profile] Workouts count:', workoutData?.length ?? 'null')
      } catch (e) {
        console.log('[Profile] Workouts error:', e?.message || e)
        workoutData = null
      }

      setFetchError('')
      setProfile(profileData || getDummyProfile())

      const w = workoutData || getDummyWorkouts()
      setWorkouts(w)
      const sd = calculateStreak(w, 3)
      setStreakData(sd)

      try {
        const types = await ensureExerciseTypes()
        setExerciseTypes(types)
        const b = await getBadge(sd.totalCompleteWeeks)
        const n = await getNextBadge(sd.totalCompleteWeeks)
        const p = await getProgressToNextBadge(sd.totalCompleteWeeks)
        setCurrentBadge(b)
        setNextBadge(n)
        setBadgeProgress(p.progress)
      } catch (e) {
        console.log('[Profile] Badge error:', e?.message || e)
      }
    } catch (e) {
      console.log('[Profile] Outer catch:', e?.message || e)
      setFetchError(e.message || 'An unexpected error occurred')
    } finally {
      console.log('[Profile] fetchData complete')
      setInitialLoad(false)
    }
  }

  useEffect(() => {
    if (!user) return
    console.log('[Profile] useEffect mount, user:', user.id)
    fetchData()
    const safetyTimer = setTimeout(() => {
      console.log('[Profile] safety timeout - forcing initialLoad=false')
      setInitialLoad(false)
    }, 20000)
    return () => clearTimeout(safetyTimer)
  }, [user])

  const prData = useMemo(() => calculatePRs(workouts), [workouts])

  const [topPRsList, setTopPRsList] = useState([])

  useEffect(() => {
    if (prData.exercises.length > 0 && exerciseTypes.length > 0) {
      getTopPRs(prData.exercises, 5).then(setTopPRsList)
    }
  }, [prData.exercises, exerciseTypes])

  const isNewPR = useCallback((exerciseName) => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const best = prData.exercises.find(e => e.name === exerciseName)?.bestWeight
    return workouts.some(
      w => w.exercise_name === exerciseName && w.weight > 0 && new Date(w.date) >= weekAgo &&
        w.weight >= (best?.value || 0)
    )
  }, [workouts, prData.exercises])

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try {
          const { error } = await supabase.auth.signOut()
          if (error) { Alert.alert('Logout Failed', error.message); return }
        } catch (e) {
          Alert.alert('Logout Failed', e.message)
          return
        }
        router.replace('/')
      }},
    ])
  }

  const initial = (profile?.display_name || profile?.username || 'A')[0].toUpperCase()
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  if (initialLoad && profile === null) {
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchData(); setRefreshing(false) }} tintColor={colors.accent} />}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{profile?.display_name || profile?.username || 'Athlete'}</Text>
        {memberSince ? <Text style={styles.memberSince}>Member since {memberSince}</Text> : null}
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.piiRow}>
          {profile?.age ? (
            <View style={styles.piiChip}>
              <Text style={styles.piiValue}>{profile.age}</Text>
              <Text style={styles.piiLabel}>Age</Text>
            </View>
          ) : null}
          {profile?.height_cm ? (
            <View style={styles.piiChip}>
              <Text style={styles.piiValue}>{profile.height_cm}</Text>
              <Text style={styles.piiLabel}>cm</Text>
            </View>
          ) : null}
          {profile?.weight_kg ? (
            <View style={styles.piiChip}>
              <Text style={styles.piiValue}>{profile.weight_kg}</Text>
              <Text style={styles.piiLabel}>kg</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity activeOpacity={0.7} style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
          <Ionicons name="create-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{prData.totalSets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <View style={styles.streakStatRow}>
            <Flame streak={streakData.streak} size={20} />
            <Text style={[styles.statNumber, { marginLeft: 6 }]}>{streakData.streak}</Text>
          </View>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{prData.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Personal Records</Text>
      <View style={styles.prCard}>
        {topPRsList.map((pr, index) => {
          const icon = getExerciseIcon(pr.name, exerciseTypes)
          const newPR = isNewPR(pr.name)
          return (
            <View key={pr.name} style={[
              styles.prRow,
              index < topPRsList.length - 1 && styles.prRowBorder,
            ]}>
              <View style={[styles.prIcon, { backgroundColor: colors.accentDim }]}>
                <Text style={styles.prIconText}>{icon}</Text>
              </View>
              <View style={styles.prInfo}>
                <View style={styles.prNameRow}>
                  <Text style={styles.prName}>{pr.name}</Text>
                  {newPR && <View style={styles.newPrBadge}><Text style={styles.newPrText}>PR</Text></View>}
                </View>
                <Text style={styles.prDetail}>
                  {pr.bestWeight.value > 0
                    ? `${pr.bestWeight.value} kg x ${pr.bestWeight.reps} reps`
                    : `${pr.bestVolume.reps} reps`}
                </Text>
              </View>
              <Text style={styles.prWeight}>
                {pr.bestWeight.value > 0 ? `${pr.bestWeight.value}kg` : `${pr.bestVolume.reps}x`}
              </Text>
            </View>
          )
        })}
        {topPRsList.length === 0 && (
          <View style={styles.emptyPr}>
            <Ionicons name="trophy-outline" size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyPrText}>Log workouts to see your PRs</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Badges</Text>
      <View style={styles.badgeSection}>
        {nextBadge ? (
          <View style={styles.badgeProgressRow}>
            <View style={[styles.badgeProgressPill, { borderColor: nextBadge.color + '60', backgroundColor: nextBadge.color + '12' }]}>
              <View style={[styles.badgeDot, { backgroundColor: nextBadge.color }]} />
              <Text style={[styles.badgeProgressName, { color: nextBadge.color }]}>{nextBadge.label}</Text>
            </View>
            <View style={styles.badgeProgressBar}>
              <View style={[styles.badgeProgressFill, { width: `${badgeProgress * 100}%`, backgroundColor: nextBadge.color }]} />
            </View>
            <Text style={styles.badgeProgressSub}>{streakData.totalCompleteWeeks} / {nextBadge.weeks} weeks</Text>
          </View>
        ) : null}
        {exerciseTypes.length > 0 ? (
          <View style={styles.badgeGrid}>
            {[104, 52, 24, 12].map((weeks) => {
              const earned = streakData.totalCompleteWeeks >= weeks
              const tierColor = weeks >= 104 ? colors.red : weeks >= 52 ? colors.teal : weeks >= 24 ? colors.purple : colors.gold
              const tierLabel = weeks >= 104 ? '2 Years' : weeks >= 52 ? '1 Year' : weeks >= 24 ? '6 Months' : '3 Months'
              return (
                <View key={weeks} style={[styles.badgeCell, earned && { borderColor: tierColor + '50', backgroundColor: tierColor + '10' }]}>
                  <View style={[styles.badgeIcon, { backgroundColor: earned ? tierColor + '25' : colors.surfaceLight }]}>
                    {earned ? (
                      <Ionicons name="checkmark-circle" size={22} color={tierColor} />
                    ) : (
                      <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
                    )}
                  </View>
                  <Text style={[styles.badgeCellLabel, earned && { color: tierColor }]}>{tierLabel}</Text>
                </View>
              )
            })}
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.logoutBtn}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.red} style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryBtnText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '800',
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.black,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  memberSince: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
  editBtn: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  piiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  piiChip: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  piiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  piiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  streakStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  prCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  prRowBorder: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  prIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prIconText: {
    fontSize: 18,
  },
  prInfo: {
    flex: 1,
  },
  prNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  newPrBadge: {
    backgroundColor: colors.green + '20',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newPrText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.green,
    letterSpacing: 0.5,
  },
  prDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  prWeight: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    marginLeft: 8,
  },
  emptyPr: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyPrText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '700',
  },
  badgeSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  badgeProgressRow: {
    marginBottom: spacing.md,
    gap: 8,
  },
  badgeProgressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeProgressName: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  badgeProgressSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  badgeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeCell: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCellLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    textAlign: 'center',
  },
  logoutBtn: {
    paddingVertical: 16,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.danger + '30',
    backgroundColor: colors.dangerDim,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  logoutText: {
    color: colors.red,
    fontSize: 15,
    fontWeight: '800',
  },
})

