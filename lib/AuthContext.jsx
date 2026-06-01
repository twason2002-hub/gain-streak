import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, setAccessToken } from './supabase'

const AuthContext = createContext({ session: null, user: null, loading: true })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.access_token) {
        setAccessToken(session.access_token)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] onAuthStateChange:', event, session ? 'has session' : 'no session')
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.access_token) {
        setAccessToken(session.access_token)
      } else {
        setAccessToken(null)
      }
      setLoading(false)
    })

    return () => {
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
