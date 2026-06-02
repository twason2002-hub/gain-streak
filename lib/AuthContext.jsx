import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({ session: null, user: null, loading: true, signOut: async () => {} })

async function getSessionWithRetry(retries = 3, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await supabase.auth.getSession()
      return result
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, delayMs * (i + 1)))
    }
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const handleSession = useCallback((s) => {
    setSession(s)
    setUser(s?.user ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    getSessionWithRetry().then(({ data: { session: s } }) => {
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
