import { useEffect, useState, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { withTimeout } from '../../lib/supabaseHelpers'
import { LineChart } from 'react-native-chart-kit'
import {
  colors,
  spacing,
  radii,
  typography,
  letterSpacing,
  iconSize,
} from '../../constants/theme'

const screenWidth = Dimensions.get('window').width

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: { padding: spacing.xs, marginRight: spacing.sm },
  title: { ...typography.h2, color: colors.text, flex: 1 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },

  metricTabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  metricTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },
  metricTabActive: { backgroundColor: colors.accentDim, borderColor: colors.accent + '60' },
  metricTabText: { fontSize: 12, fontWeight: '800', color: colors.textSecondary },
  metricTabTextActive: { color: colors.accent },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  chartTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  chartSubtitle: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.md },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 18, fontWeight: '900', color: colors.accent },
  statLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginTop: 2 },

  historySection: { marginTop: spacing.md },
  historyTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
  },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  historyDate: { width: 80, fontSize: 12, fontWeight: '700', color: colors.textMuted },
  historyWeight: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text },
  historyReps: { width: 50, fontSize: 13, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  historyVolume: { width: 70, fontSize: 13, fontWeight: '800', color: colors.accent, textAlign: 'right' },
  prBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.green,
    backgroundColor: colors.green + '20',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: spacing.xs,
  },
})

export default function ExerciseChartScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const { exercise } = useLocalSearchParams()
  const [metric, setMetric] = useState('weight')
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !exercise) return
    loadData()
  }, [user, exercise])

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await withTimeout(
        supabase.from('workout_sets')
          .select('exercise_name, reps, weight, created_at')
          .eq('user_id', user.id)
          .eq('exercise_name', exercise)
          .order('created_at', { ascending: true }),
        10000
      )
      if (data) setSets(data)
    } catch {}
    setLoading(false)
  }

  const chartData = useMemo(() => {
    if (sets.length === 0) return { labels: [], datasets: [{ data: [] }] }

    const dailyMap = {}
    sets.forEach(s => {
      const date = new Date(s.created_at).toISOString().split('T')[0]
      if (!dailyMap[date]) dailyMap[date] = []
      dailyMap[date].push(s)
    })

    const dates = Object.keys(dailyMap).sort()
    const labels = dates.map(d => {
      const dt = new Date(d + 'T00:00:00')
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })

    let data
    if (metric === 'weight') {
      data = dates.map(d => {
        const daySets = dailyMap[d]
        return Math.max(...daySets.map(s => parseFloat(s.weight) || 0))
      })
    } else if (metric === 'reps') {
      data = dates.map(d => {
        const daySets = dailyMap[d]
        return Math.max(...daySets.map(s => parseInt(s.reps) || 0))
      })
    } else {
      data = dates.map(d => {
        const daySets = dailyMap[d]
        return daySets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)
      })
    }

    return {
      labels,
      datasets: [{ data }],
    }
  }, [sets, metric])

  const stats = useMemo(() => {
    if (sets.length === 0) return { bestWeight: 0, bestReps: 0, totalVolume: 0, totalSets: 0 }
    const bestWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0))
    const bestReps = Math.max(...sets.map(s => parseInt(s.reps) || 0))
    const totalVolume = sets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)
    return { bestWeight, bestReps, totalVolume, totalSets: sets.length }
  }, [sets])

  const historyByDate = useMemo(() => {
    const map = {}
    sets.forEach(s => {
      const date = new Date(s.created_at).toISOString().split('T')[0]
      if (!map[date]) map[date] = []
      map[date].push(s)
    })
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 20)
  }, [sets])

  const maxWeight = useMemo(() => {
    const m = {}
    sets.forEach(s => {
      const w = parseFloat(s.weight) || 0
      const date = new Date(s.created_at).toISOString().split('T')[0]
      if (!m[s.exercise_name] || m[s.exercise_name].weight < w) {
        m[s.exercise_name] = { weight: w, date }
      }
    })
    return m
  }, [sets])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={iconSize.md} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{exercise}</Text>
          <Text style={styles.subtitle}>{sets.length} sets logged</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.bestWeight}</Text>
          <Text style={styles.statLabel}>Best kg</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.bestReps}</Text>
          <Text style={styles.statLabel}>Best reps</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(stats.totalVolume)}</Text>
          <Text style={styles.statLabel}>Vol kg</Text>
        </View>
      </View>

      <View style={styles.metricTabs}>
        {[
          { key: 'weight', label: 'Weight' },
          { key: 'reps', label: 'Reps' },
          { key: 'volume', label: 'Volume' },
        ].map(m => (
          <TouchableOpacity
            key={m.key}
            style={[styles.metricTab, metric === m.key && styles.metricTabActive]}
            onPress={() => setMetric(m.key)}
          >
            <Text style={[styles.metricTabText, metric === m.key && styles.metricTabTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {chartData.datasets[0].data.length > 1 ? (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {metric === 'weight' ? 'Max Weight' : metric === 'reps' ? 'Max Reps' : 'Total Volume'}
          </Text>
          <Text style={styles.chartSubtitle}>Progression over time</Text>
          <LineChart
            data={chartData}
            width={screenWidth - spacing.lg * 2 - spacing.md * 2}
            height={220}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(250, 204, 21, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(163, 163, 163, ${opacity})`,
              style: { borderRadius: radii.lg },
              propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accent },
              propsForBackgroundLines: { strokeDasharray: '', stroke: colors.border, strokeOpacity: 0.5 },
            }}
            bezier
            style={{ borderRadius: radii.lg }}
            withInnerLines={false}
            withOuterLines
            withVerticalLines={false}
            withHorizontalLines
            fromZero
          />
        </View>
      ) : (
        <View style={styles.chartCard}>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl }}>
            Log more workouts to see your progress chart
          </Text>
        </View>
      )}

      {historyByDate.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>History</Text>
          <View style={styles.historyCard}>
            {historyByDate.map(([date, daySets], idx) => {
              const bestSet = daySets.reduce((best, s) => {
                const w = parseFloat(s.weight) || 0
                return w > best.weight ? { ...s, weight: w } : best
              }, { weight: 0 })
              const isPR = bestSet.weight > 0 && maxWeight[exercise]?.date === date

              return (
                <View key={date} style={[styles.historyRow, idx < historyByDate.length - 1 && styles.historyRowBorder]}>
                  <Text style={styles.historyDate}>
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.historyWeight}>
                    {bestSet.weight} kg
                    {isPR && <Text style={styles.prBadge}>PR</Text>}
                  </Text>
                  <Text style={styles.historyReps}>{bestSet.reps}x</Text>
                  <Text style={styles.historyVolume}>
                    {Math.round(daySets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0))}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      )}
    </ScrollView>
  )
}
