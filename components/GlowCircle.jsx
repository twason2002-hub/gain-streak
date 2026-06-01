import { View } from 'react-native'
import { colors, shadows } from '../constants/theme'

export default function GlowCircle({
  size = 80,
  color = colors.accent,
  ringWidth = 2,
  ringOpacity = 0.25,
  background,
  children,
  style,
}) {
  const ringSize = size + 8

  return (
    <View
      style={[
        {
          width: ringSize,
          height: ringSize,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderWidth: 1,
          borderColor: color,
          opacity: ringOpacity,
        }}
      />
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: background ?? colors.surfaceLight,
            borderWidth: ringWidth,
            borderColor: color,
            justifyContent: 'center',
            alignItems: 'center',
          },
          shadows.glow(color),
        ]}
      >
        {children}
      </View>
    </View>
  )
}
