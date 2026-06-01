import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, setAccessToken } from './supabase'

const AuthContext = createContext({ session: null, user: null, loading: true, signOut: async () => {} })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const handleSession = useCallback((s) => {
    setSession(s)
    setUser(s?.user ?? null)
    if (s?.access_token) {
      setAccessToken(s.access_token)
    } else {
      setAccessToken(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      handleSession(s)
    }).catch(() => {
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      handleSession(s)
    })

    return () => {
      data?.subscription?.unsubscribe()
    }
  }, [handleSession])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    setSession(null)
    setUser(null)
    setAccessToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be within AuthProvider')
  return ctx
}
