import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '../lib/AuthContext'
import { colors } from '../constants/theme'

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 18 },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login', presentation: 'modal', headerBackTitle: 'Back' }} />
        <Stack.Screen name="signup" options={{ title: 'Sign Up', presentation: 'modal', headerBackTitle: 'Back' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile', presentation: 'modal', headerBackTitle: 'Back' }} />
      </Stack>
    </AuthProvider>
  )
}
