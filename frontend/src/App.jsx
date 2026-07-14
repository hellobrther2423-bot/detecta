import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider, useAuth } from './store/auth'
import { ThemeProvider } from './store/theme'
import { LanguageProvider, useLanguageSwitch } from './store/language'
import { ToastProvider } from './components/Toast'
import AnimatedBackground from './components/AnimatedBackground'
import ChatWidget from './components/ChatWidget'
import { getInitialLang, applyLanguage } from './i18n'
import AppLayout from './components/AppLayout'

import Landing from './pages/Landing'
import Pricing from './pages/Pricing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Processing from './pages/Processing'
import Review from './pages/Review'
import Results from './pages/Results'
import History from './pages/History'
import Learn from './pages/Learn'
import Profile from './pages/Profile'

// First-visit language chooser. Blocks the app until a language is picked, then
// never shows again (persisted in localStorage).
function LanguageGate({ children }) {
  const [chosen, setChosen] = useState(Boolean(getInitialLang()))
  if (chosen) return children
  return (
    <div className="overlay">
      <div className="modal center">
        <div style={{
          width: 56, height: 56, margin: '0 auto 12px', borderRadius: 16,
          display: 'grid', placeItems: 'center', fontSize: 28, color: '#fff',
          background: 'linear-gradient(135deg, var(--teal), var(--teal-dark))',
          boxShadow: '0 8px 24px rgba(14,154,167,0.4)',
        }}>◎</div>
        <h2 className="mt-0">DETECTA</h2>
        <p className="muted">Choose your language · اختر لغتك</p>
        <div className="stack" style={{ marginTop: 20 }}>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => { applyLanguage('en'); setChosen(true) }}>
            English
          </button>
          <button className="btn btn-ghost btn-block btn-lg" onClick={() => { applyLanguage('ar'); setChosen(true) }}>
            العربية
          </button>
        </div>
      </div>
    </div>
  )
}

function Protected({ children }) {
  const { user, loading } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  if (loading) return <div className="container center muted">{t('common.loading')}</div>
  if (!user) return <Navigate to="/signin" replace />
  // Force onboarding once after signup. Use router location (pathname is unreliable with HashRouter).
  if (!user.onboarding_complete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/app" replace />
  return children
}

// Dims/blurs the whole app while a language transition is in progress.
function AppContent({ children }) {
  const { transitioning } = useLanguageSwitch()
  return <div className={`app-content ${transitioning ? 'switching' : ''}`}>{children}</div>
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <LanguageGate>
              <AnimatedBackground />
              <AppContent>
                <HashRouter>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/signin" element={<PublicOnly><SignIn /></PublicOnly>} />
                    <Route path="/signup" element={<PublicOnly><SignUp /></PublicOnly>} />
                    <Route path="/forgot" element={<ForgotPassword />} />
                    <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />

                    <Route path="/app" element={<Protected><AppLayout /></Protected>}>
                      <Route index element={<Home />} />
                      <Route path="upload" element={<Upload />} />
                      <Route path="processing/:id" element={<Processing />} />
                      <Route path="review/:id" element={<Review />} />
                      <Route path="results/:id" element={<Results />} />
                      <Route path="history" element={<History />} />
                      <Route path="learn" element={<Learn />} />
                      <Route path="profile" element={<Profile />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </HashRouter>
              </AppContent>
              <ChatWidget />
            </LanguageGate>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
