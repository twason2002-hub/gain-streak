import { View } from 'react-native'
import { colors } from '../constants/theme'

export default function Dot({
  size = 12,
  filled = false,
  color = colors.green,
  borderColor,
  style,
}) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: filled ? color : colors.surfaceLight,
          borderWidth: 1,
          borderColor: filled ? color : (borderColor || colors.border),
        },
        style,
      ]}
    />
  )
}
