import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import LanguageToggle from '../components/LanguageToggle'
import ThemeToggle from '../components/ThemeToggle'
import PasswordInput from '../components/PasswordInput'
import Page from '../components/Page'

// Demo-mode password reset: works entirely client-side.
// In production, swap the demo logic for real API calls.
export default function ForgotPassword() {
  const { t } = useTranslation()
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const requestCode = async (ev) => {
    ev.preventDefault()
    setError(''); setBusy(true)

    try {
      const res = await api.requestReset({ email })
      if (res.dev_code) {
        setGeneratedCode(res.dev_code)
      }
      setMessage(t('auth.resetSent'))
      setStep('confirm')
    } catch {
      setError(t('auth.errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  const confirm = async (ev) => {
    ev.preventDefault()
    setError(''); setBusy(true)

    if (newPassword.length < 6) {
      setError(t('auth.errors.weakPassword') || 'Password must be at least 6 characters.')
      setBusy(false)
      return
    }

    try {
      await api.confirmReset({ email, code, new_password: newPassword })
      setMessage(t('auth.resetSuccess'))
      setStep('done')
    } catch (err) {
      setError(err.detail === 'invalid_or_expired_code' ? (t('auth.errors.invalidCode') || 'Invalid code.') : t('auth.errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page className="container" style={{ maxWidth: 440 }}>
      <div className="row spread" style={{ marginBottom: 20 }}>
        <Link to="/" style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{t('app.name')}</Link>
        <div className="row">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      <div className="card card-pad-lg">
        <h1 className="mt-0">{t('auth.resetTitle')}</h1>
        {message && <div className="form-success">{message}</div>}
        {error && <div className="form-error">{error}</div>}

        {step === 'request' && (
          <form onSubmit={requestCode}>
            <div className="field">
              <label>{t('auth.email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? t('common.loading') : t('auth.resetSend')}
            </button>
          </form>
        )}

        {step === 'confirm' && (
          <>
            {/* Show the demo code so the user can actually use it */}
            <div className="demo-code-banner">
              <div className="demo-code-label">
                <span className="demo-code-icon">📧</span>
                Demo Mode — Your reset code:
              </div>
              <div className="demo-code-value">{generatedCode}</div>
              <div className="demo-code-hint">
                In production, this code would be sent to <strong>{email}</strong>
              </div>
            </div>

            <form onSubmit={confirm}>
              <div className="field">
                <label>{t('auth.resetCode')}</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                />
              </div>
              <div className="field">
                <label>{t('auth.newPassword')}</label>
                <PasswordInput value={newPassword} autoComplete="new-password"
                  onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-block" disabled={busy}>
                {busy ? t('common.loading') : t('auth.resetConfirm')}
              </button>
            </form>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
            <p>{t('auth.resetSuccess')}</p>
            <Link to="/signin" className="btn btn-primary btn-block">{t('auth.signIn')}</Link>
          </div>
        )}

        <div className="center small muted" style={{ marginTop: 18 }}>
          <Link to="/signin">{t('common.back')}</Link>
        </div>
      </div>
    </Page>
  )
}
