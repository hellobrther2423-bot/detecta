import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/auth'
import { api } from '../api/client'
import LanguageToggle from '../components/LanguageToggle'
import ThemeToggle from '../components/ThemeToggle'
import PasswordInput from '../components/PasswordInput'
import Page from '../components/Page'
import { CheckIcon } from '../components/icons'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Common countries in the region first, then a broad set. Value stays a plain string.
const COUNTRIES = [
  'Saudi Arabia', 'United Arab Emirates', 'Egypt', 'Jordan', 'Kuwait', 'Qatar',
  'Bahrain', 'Oman', 'Lebanon', 'Iraq', 'Palestine', 'Syria', 'Yemen', 'Morocco',
  'Algeria', 'Tunisia', 'Libya', 'Sudan', 'United States', 'United Kingdom', 'Other',
]

export default function SignUp() {
  const { t, i18n } = useTranslation()
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirm: '',
    role: 'patient', phone: '', country: '', dateOfBirth: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const validateStep1 = () => {
    const e = {}
    if (!form.fullName || form.fullName.trim().length < 2) e.fullName = t('auth.errors.nameShort')
    if (!form.email) e.email = t('auth.errors.required')
    else if (!EMAIL_RE.test(form.email)) e.email = t('auth.errors.invalidEmail')
    if (!form.password) e.password = t('auth.errors.required')
    else if (form.password.length < 8) e.password = t('auth.errors.passwordShort')
    if (form.confirm !== form.password) e.confirm = t('auth.errors.passwordMismatch')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = (ev) => {
    ev.preventDefault()
    setFormError('')
    if (validateStep1()) setStep(2)
  }

  const submit = async (ev) => {
    ev.preventDefault()
    setFormError('')
    setBusy(true)
    try {
      await signup({
        full_name: form.fullName.trim(),
        email: form.email,
        password: form.password,
        language: i18n.language,
        role: form.role,
        phone: form.phone || null,
        country: form.country || null,
        date_of_birth: form.dateOfBirth || null,
      })
      navigate('/onboarding')
    } catch (err) {
      setFormError(err.status === 409 ? t('auth.errors.emailTaken') : t('auth.errors.generic'))
      setStep(1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Page className="container" style={{ maxWidth: 480 }}>
      <div className="row spread" style={{ marginBottom: 20 }}>
        <Link to="/" style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{t('app.name')}</Link>
        <div className="row">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="card card-pad-lg">
        <h1 className="mt-0">{t('auth.signUpTitle')}</h1>

        {/* Step progress */}
        <div className="row" style={{ gap: 8, marginBottom: 20 }}>
          {[1, 2].map((s) => (
            <div key={s} className="row" style={{ gap: 8, flex: 1 }}>
              <span className={`step-dot ${step > s ? 'done' : step === s ? 'active' : ''}`}
                style={{ width: 28, height: 28, fontSize: '0.85rem' }}>
                {step > s ? <CheckIcon width={15} height={15} /> : s}
              </span>
              <span className="small" style={{ color: step >= s ? 'var(--text)' : 'var(--text-muted)', fontWeight: step === s ? 600 : 400 }}>
                {t(`auth.step${s}Label`)}
              </span>
              {s === 1 && <span style={{ flex: 1, height: 2, background: 'var(--border)', borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        {formError && <div className="form-error">{formError}</div>}

        {step === 1 && (
          <form onSubmit={next} noValidate>
            <p className="muted small mt-0" style={{ marginBottom: 16 }}>{t('auth.createAccountIntro')}</p>
            <div className="field">
              <label>{t('auth.roleLabel')}</label>
              <div className="role-picker">
                {['patient', 'doctor'].map((r) => (
                  <button type="button" key={r}
                    className={`role-option ${form.role === r ? 'active' : ''}`}
                    onClick={() => set('role', r)}>
                    <span className="role-emoji">{r === 'patient' ? '🧑‍⚕️' : '👨‍⚕️'}</span>
                    <strong>{t(`auth.role${r === 'patient' ? 'Patient' : 'Doctor'}`)}</strong>
                    <span className="muted small">{t(`auth.role${r === 'patient' ? 'Patient' : 'Doctor'}Desc`)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>{t('auth.fullName')}</label>
              <input value={form.fullName} autoComplete="name"
                onChange={(e) => set('fullName', e.target.value)} />
              {errors.fullName && <div className="field-error">{errors.fullName}</div>}
            </div>
            <div className="field">
              <label>{t('auth.email')}</label>
              <input type="email" value={form.email} autoComplete="email"
                onChange={(e) => set('email', e.target.value)} />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <div className="field">
              <label>{t('auth.password')}</label>
              <PasswordInput value={form.password} autoComplete="new-password"
                onChange={(e) => set('password', e.target.value)} />
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>
            <div className="field">
              <label>{t('auth.confirmPassword')}</label>
              <PasswordInput value={form.confirm} autoComplete="new-password"
                onChange={(e) => set('confirm', e.target.value)} />
              {errors.confirm && <div className="field-error">{errors.confirm}</div>}
            </div>
            <button className="btn btn-primary btn-block btn-lg">{t('auth.continue')}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submit} noValidate>
            <p className="muted small mt-0" style={{ marginBottom: 16 }}>{t('auth.aboutYouIntro')}</p>
            <div className="field">
              <label>{t('auth.phone')} <span className="muted small">({t('auth.optional')})</span></label>
              <input type="tel" value={form.phone} autoComplete="tel"
                onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="field">
              <label>{t('auth.country')} <span className="muted small">({t('auth.optional')})</span></label>
              <select value={form.country} onChange={(e) => set('country', e.target.value)}>
                <option value="">—</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>{t('auth.dateOfBirth')} <span className="muted small">({t('auth.optional')})</span></label>
              <input type="date" value={form.dateOfBirth}
                onChange={(e) => set('dateOfBirth', e.target.value)} />
            </div>
            <div className="row" style={{ gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>{t('common.back')}</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={busy}>
                {busy ? t('common.loading') : t('auth.signUp')}
              </button>
            </div>
          </form>
        )}

        <div className="center small muted" style={{ marginTop: 18 }}>
          {t('auth.hasAccount')} <Link to="/signin">{t('auth.signIn')}</Link>
        </div>
      </div>
    </Page>
  )
}
