import { createContext, useCallback, useContext, useRef, useState } from 'react'

// Lightweight toast system. Call const toast = useToast(); toast.success('msg') / toast.error('msg').
const ToastContext = createContext(null)

let counter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    // allow exit animation before unmount
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 260)
  }, [])

  const push = useCallback((message, variant = 'default') => {
    const id = ++counter
    setToasts((list) => [...list, { id, message, variant, leaving: false }])
    timers.current[id] = setTimeout(() => remove(id), 3200)
    return id
  }, [remove])

  const api = {
    show: (m) => push(m, 'default'),
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-wrap" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.variant} ${t.leaving ? 'leaving' : ''}`} role="status">
            <span className="toast-icon" aria-hidden="true">
              {t.variant === 'success' ? '✓' : t.variant === 'error' ? '!' : 'ⓘ'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
