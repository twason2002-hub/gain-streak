import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

console.log('[Supabase] Initializing with URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING')
console.log('[Supabase] Key present:', supabaseAnonKey ? 'yes (' + supabaseAnonKey.substring(0, 10) + '...)' : 'MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

let _accessToken = null

export function setAccessToken(token) {
  _accessToken = token
}

supabase.rest.fetch = async (url, options) => {
  const token = _accessToken || supabaseAnonKey
  const headers = new Headers(options?.headers)
  if (!headers.has('apikey')) {
    headers.set('apikey', supabaseAnonKey)
  }
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(url, { ...options, headers })
}
