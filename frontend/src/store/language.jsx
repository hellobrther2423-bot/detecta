import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { applyLanguage } from '../i18n'
import { api, getToken } from '../api/client'

// Smoothly transitions between languages: fades the app out under a branded
// overlay, flips language + direction while hidden, then fades back in — so the
// RTL/LTR layout change is a graceful crossfade instead of an abrupt static flip.
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [transitioning, setTransitioning] = useState(false)
  const [phase, setPhase] = useState('idle') // idle | out | in
  const busy = useRef(false)

  const switchLanguage = useCallback(async (lang, { persist = false } = {}) => {
    if (busy.current) return
    const current = document.documentElement.lang
    if (lang === current) return
    busy.current = true

    setTransitioning(true)
    setPhase('out')
    // Wait for fade-out, then swap language while the veil covers the app.
    await new Promise((r) => setTimeout(r, 260))
    applyLanguage(lang)
    if (persist && getToken()) {
      api.updateSettings({ language: lang }).catch(() => {})
    }
    setPhase('in')
    await new Promise((r) => setTimeout(r, 320))
    setTransitioning(false)
    setPhase('idle')
    busy.current = false
  }, [])

  return (
    <LanguageContext.Provider value={{ switchLanguage, transitioning }}>
      {children}
      {transitioning && (
        <div className={`lang-veil ${phase}`} aria-hidden="true">
          <div className="lang-veil-mark">◎</div>
        </div>
      )}
    </LanguageContext.Provider>
  )
}

export function useLanguageSwitch() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguageSwitch must be used within LanguageProvider')
  return ctx
}
