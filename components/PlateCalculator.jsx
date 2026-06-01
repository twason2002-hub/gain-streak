import { useMemo } from 'react'
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  colors,
  spacing,
  radii,
  letterSpacing,
  shadows,
  iconSize,
} from '../constants/theme'

const PLATES = [20, 15, 10, 5, 2.5, 1.25]

const PLATE_STYLE = {
  20:   { color: colors.red,    height: 110, width: 14 },
  15:   { color: colors.blue,   height: 96,  width: 13 },
  10:   { color: '#22D3EE',     height: 82,  width: 12 },
  5:    { color: colors.green,  height: 68,  width: 11 },
  2.5:  { color: colors.gold,   height: 54,  width: 10 },
  1.25: { color: colors.purple, height: 40,  width: 9  },
}

function breakdown(perSide) {
  const result = []
  let remaining = perSide
  for (const p of PLATES) {
    let count = 0
    while (remaining >= p - 1e-9) {
      remaining = +(remaining - p).toFixed(4)
      count++
    }
    if (count > 0) result.push({ plate: p, count })
  }
  return { plates: result, leftover: +remaining.toFixed(4) }
}

export default function PlateCalculator({ visible, onClose, totalWeight }) {
  const total = Math.max(0, parseFloat(totalWeight) || 0)
  const perSide = total / 2

  const { plates, leftover } = useMemo(() => breakdown(perSide), [perSide])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="calculator-outline" size={iconSize.md} color={colors.accent} />
              <Text style={styles.title}>Plate Calculator</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close calculator"
            >
              <Ionicons name="close" size={iconSize.lg} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{total} kg</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Per side</Text>
              <Text style={[styles.summaryValue, { color: colors.accent }]}>{perSide} kg</Text>
            </View>
          </View>

          {total === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="scale-outline" size={iconSize.xl} color={colors.textMuted} style={{ marginBottom: spacing.sm }} />
              <Text style={styles.emptyText}>Enter a weight to see plate breakdown</Text>
            </View>
          ) : (
            <>
              <View style={styles.barbell}>
                <PlateStack plates={plates} side="left" />
                <View style={styles.barCenter}>
                  <View style={styles.bar} />
                  <View style={styles.barSleeve} />
                </View>
                <PlateStack plates={plates} side="right" />
              </View>

              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {plates.length === 0 ? (
                  <Text style={styles.noPlatesText}>
                    {leftover > 0 ? "Can't make this exactly with available plates." : 'No plates needed.'}
                  </Text>
                ) : (
                  plates.map(({ plate, count }) => {
                    const style = PLATE_STYLE[plate]
                    return (
                      <View key={plate} style={styles.row}>
                        <View style={styles.rowLeft}>
                          <View style={[styles.swatch, { backgroundColor: style.color }]} />
                          <Text style={styles.rowPlate}>{plate} kg</Text>
                        </View>
                        <View style={styles.rowRight}>
                          <Text style={styles.rowCount}>{count} <Text style={styles.rowPerSide}>per side</Text></Text>
                          <Text style={styles.rowTotal}>×{count * 2} total</Text>
                        </View>
                      </View>
                    )
                  })
                )}

                {leftover > 0 ? (
                  <View style={styles.warnBox}>
                    <Ionicons name="alert-circle-outline" size={iconSize.sm + 2} color={colors.orange} />
                    <Text style={styles.warnText}>
                      {leftover.toFixed(2)} kg per side cannot be loaded with available plates.
                    </Text>
                  </View>
                ) : null}
              </ScrollView>
            </>
          )}

          <View style={styles.legend}>
            <Text style={styles.legendLabel}>Available plates</Text>
            <View style={styles.legendRow}>
              {PLATES.map((p) => (
                <View key={p} style={styles.legendChip}>
                  <View style={[styles.legendDot, { backgroundColor: PLATE_STYLE[p].color }]} />
                  <Text style={styles.legendText}>{p}</Text>
                </View>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function PlateStack({ plates, side }) {
  const flat = []
  plates.forEach(({ plate, count }) => {
    for (let i = 0; i < count; i++) flat.push(plate)
  })
  // Heaviest closest to bar center.
  const ordered = side === 'left' ? [...flat].reverse() : flat
  return (
    <View style={[styles.stack, side === 'left' ? styles.stackLeft : styles.stackRight]}>
      {ordered.map((p, i) => {
        const s = PLATE_STYLE[p]
        return (
          <View
            key={`${side}-${i}-${p}`}
            style={[
              styles.plate,
              {
                width: s.width,
                height: s.height,
                backgroundColor: s.color,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    maxHeight: '88%',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.3,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.normal,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  barbell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    minHeight: 140,
  },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  stackLeft: {
    justifyContent: 'flex-end',
  },
  stackRight: {
    justifyContent: 'flex-start',
  },
  plate: {
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  barCenter: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
  },
  barSleeve: {
    position: 'absolute',
    width: 24,
    height: 18,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    alignSelf: 'center',
  },
  list: {
    maxHeight: 240,
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  noPlatesText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
  },
  swatch: {
    width: 14,
    height: 26,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  rowPlate: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowCount: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.accent,
  },
  rowPerSide: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.tight,
  },
  rowTotal: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 2,
  },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.orange + '12',
    borderColor: colors.orange + '40',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm + spacing.xs,
    marginTop: spacing.md,
  },
  warnText: {
    flex: 1,
    color: colors.orange,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  legend: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.normal,
    marginBottom: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  legendText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '800',
  },
})
