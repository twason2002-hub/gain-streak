import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  colors,
  spacing,
  radii,
  letterSpacing,
  shadows,
} from '../constants/theme'

const TIERS = [
  { weeks: 12, label: 'Gold', color: colors.gold },
  { weeks: 24, label: 'Purple', color: colors.purple },
  { weeks: 52, label: 'Teal', color: colors.teal },
  { weeks: 104, label: 'Red', color: colors.red },
]

function nextTier(totalWeeks) {
  return TIERS.find((t) => totalWeeks < t.weeks) || null
}

function previousTierWeeks(totalWeeks) {
  let prev = 0
  for (const t of TIERS) {
    if (totalWeeks >= t.weeks) prev = t.weeks
    else break
  }
  return prev
}

function flameColorFor(streak) {
  const intensity = Math.min(streak / 52, 1)
  if (intensity > 0.5) return colors.orangeBr
  if (intensity > 0.2) return colors.orange
  return colors.gold
}

// Solid progress ring built from many thin radial segments arranged in a circle.
// Starts at 12 o'clock and sweeps clockwise. Pure View, no SVG.
const SEGMENTS = 90
const SEGMENT_ARC = 360 / SEGMENTS // 4 degrees each

function SolidRing({ size, thickness, progress, color, trackColor }) {
  const half = size / 2
  const safeProgress = Math.max(0, Math.min(1, progress))
  const filledCount = Math.round(SEGMENTS * safeProgress)

  // Each segment is a thin tall rectangle whose top edge sits on the ring radius.
  // Width is sized so adjacent segments overlap slightly and read as solid.
  const segWidth = Math.ceil((Math.PI * size) / SEGMENTS) + 2
  const segHeight = thickness

  const segments = []
  for (let i = 0; i < SEGMENTS; i++) {
    const angle = i * SEGMENT_ARC // 0deg = top (12 o'clock), increases clockwise
    const isOn = i < filledCount
    segments.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          left: half - segWidth / 2,
          top: 0,
          width: segWidth,
          height: half,
          transform: [{ rotate: `${angle}deg` }],
          transformOrigin: `${segWidth / 2}px ${half}px`,
        }}
        pointerEvents="none"
      >
        <View
          style={{
            width: segWidth,
            height: segHeight,
            backgroundColor: isOn ? color : trackColor,
          }}
        />
      </View>
    )
  }

  return (
    <View style={{ width: size, height: size }}>
      {segments}

      {/* Outer glow */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: half,
          shadowColor: color,
          shadowOpacity: 0.5,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        }}
      />
    </View>
  )
}

export default function StreakHero({
  streak = 0,
  totalWeeks = 0,
  size = 'lg',
  style,
}) {
  const flameColor = flameColorFor(streak)
  const tier = nextTier(totalWeeks)
  const prevWeeks = previousTierWeeks(totalWeeks)
  const progress = tier
    ? (totalWeeks - prevWeeks) / (tier.weeks - prevWeeks)
    : 1

  const ringColor = tier ? tier.color : flameColor
  const isCompact = size === 'sm'
  const ringSize = isCompact ? 180 : 220
  const thickness = isCompact ? 8 : 10
  const numberSize = isCompact ? 60 : 80
  const numberLine = isCompact ? 64 : 84
  const cardPadV = isCompact ? spacing.lg : spacing.xl

  const subtext = tier
    ? `Next: ${tier.label} · ${tier.weeks - totalWeeks} ${tier.weeks - totalWeeks === 1 ? 'week' : 'weeks'} to go`
    : 'Max tier reached. Legend.'

  return (
    <View
      style={[
        styles.card,
        {
          paddingVertical: cardPadV,
          borderColor: ringColor + '35',
          backgroundColor: ringColor + '0E',
        },
        shadows.glow(ringColor),
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[styles.glowBlob, { backgroundColor: ringColor + '22' }]}
      />

      <View style={[styles.ringWrap, { width: ringSize, height: ringSize }]}>
        <SolidRing
          size={ringSize}
          thickness={thickness}
          progress={progress}
          color={ringColor}
          trackColor={colors.borderLight}
        />

        <View style={[styles.center, { width: ringSize, height: ringSize }]}>
          <Ionicons
            name="flame"
            size={isCompact ? 22 : 26}
            color={flameColor}
            style={styles.flameIcon}
          />
          <Text
            style={[
              styles.number,
              {
                fontSize: numberSize,
                lineHeight: numberLine,
                color: ringColor,
                textShadowColor: ringColor + '88',
              },
            ]}
            numberOfLines={1}
          >
            {streak}
          </Text>
          <Text style={[styles.weeksLabel, { color: ringColor }]}>
            {streak === 1 ? 'WEEK' : 'WEEKS'}
          </Text>
        </View>
      </View>

      <Text style={[styles.subtext, tier ? null : { color: colors.gold }]}>
        {subtext}
      </Text>
      {totalWeeks > 0 ? (
        <Text style={styles.totalLine}>
          {totalWeeks} total {totalWeeks === 1 ? 'week' : 'weeks'} completed
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  glowBlob: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.55,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameIcon: {
    marginBottom: spacing.xs,
    opacity: 0.9,
  },
  number: {
    fontWeight: '900',
    letterSpacing: -3,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
    includeFontPadding: false,
  },
  weeksLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
    opacity: 0.85,
  },
  subtext: {
    marginTop: spacing.lg,
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: letterSpacing.tight,
    textAlign: 'center',
  },
  totalLine: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: letterSpacing.tight,
    textTransform: 'uppercase',
  },
})
