import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../constants/theme'

export default function Flame({ streak, size = 32 }) {
  const intensity = Math.min(streak / 52, 1)
  const flameColor = intensity > 0.5 ? colors.orangeBr : intensity > 0.2 ? colors.orange : colors.gold
  const iconSize = size * 0.55

  return (
    <View style={{
      width: size + 8,
      height: size + 8,
      borderRadius: (size + 8) / 2,
      backgroundColor: flameColor + '15',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: flameColor + '25',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Ionicons name="flame" size={iconSize} color={flameColor} />
      </View>
    </View>
  )
}
