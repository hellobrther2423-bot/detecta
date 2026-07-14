import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, setToken } from '../api/client'
import { applyLanguage } from '../i18n'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    try {
      const me = await api.me()
      setUser(me)
      if (me.language) applyLanguage(me.language)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only attempt /me if we have a token stored.
    if (localStorage.getItem('detectoma_token')) loadMe()
    else setLoading(false)
  }, [loadMe])

  const handleAuth = (resp) => {
    setToken(resp.access_token)
    setUser(resp.user)
    if (resp.user.language) applyLanguage(resp.user.language)
  }

  const signin = async (creds) => handleAuth(await api.signin(creds))
  const signup = async (creds) => handleAuth(await api.signup(creds))
  const signout = () => {
    setToken(null)
    setUser(null)
  }
  const refresh = loadMe
  const patchUser = (patch) => setUser((u) => ({ ...u, ...patch }))

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, signout, refresh, patchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
