import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, shadows } from '../constants/theme'

export default function Flame({ streak = 0, size = 32 }) {
  const intensity = Math.min(streak / 52, 1)
  const flameColor =
    intensity > 0.5 ? colors.orangeBr : intensity > 0.2 ? colors.orange : colors.gold
  const iconSize = Math.round(size * 0.55)
  const ringSize = size + 8

  return (
    <View style={[styles.outer, { width: ringSize, height: ringSize }]}>
      <View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: flameColor,
          },
        ]}
      />
      <View
        style={[
          styles.inner,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: flameColor + '25',
          },
          shadows.glow(flameColor),
        ]}
      >
        <Ionicons name="flame" size={iconSize} color={flameColor} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    opacity: 0.25,
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
