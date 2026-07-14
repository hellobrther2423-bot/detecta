import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/auth'
import LanguageToggle from '../components/LanguageToggle'
import ThemeToggle from '../components/ThemeToggle'
import PasswordInput from '../components/PasswordInput'
import Page from '../components/Page'
import { useToast } from '../components/Toast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignIn() {
  const { t } = useTranslation()
  const { signin } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email) e.email = t('auth.errors.required')
    else if (!EMAIL_RE.test(form.email)) e.email = t('auth.errors.invalidEmail')
    if (!form.password) e.password = t('auth.errors.required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    setFormError('')
    if (!validate()) return
    setBusy(true)
    try {
      await signin(form)
      toast.success(t('toast.welcome'))
      navigate('/app')
    } catch (err) {
      setFormError(err.detail === 'invalid_credentials'
        ? t('auth.errors.invalidCredentials') : t('auth.errors.generic'))
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
        <h1 className="mt-0">{t('auth.signInTitle')}</h1>
        {formError && <div className="form-error">{formError}</div>}
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label>{t('auth.email')}</label>
            <input type="email" value={form.email} autoComplete="email"
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>
          <div className="field">
            <label>{t('auth.password')}</label>
            <PasswordInput value={form.password} autoComplete="current-password"
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? t('common.loading') : t('auth.signIn')}
          </button>
        </form>
        <div className="stack center" style={{ marginTop: 18 }}>
          <Link to="/forgot" className="small">{t('auth.forgot')}</Link>
          <div className="small muted">
            {t('auth.noAccount')} <Link to="/signup">{t('auth.signUp')}</Link>
          </div>
        </div>
      </div>
    </Page>
  )
}
