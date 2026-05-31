import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, setAccessToken } from './supabase'

const AuthContext = createContext({ session: null, user: null, loading: true })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
        setUser(session.user ?? null)
        setAccessToken(session.access_token)
      }
    }).catch(() => {})

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.access_token) {
        setAccessToken(session.access_token)
      }
      setLoading(false)
    })

    const timer = setTimeout(() => setLoading(false), 3000)

    return () => {
      clearTimeout(timer)
      data?.subscription?.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be within AuthProvider')
  return ctx
}
