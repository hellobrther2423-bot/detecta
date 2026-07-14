import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, setToken } from '../api/client'
import { useAuth } from '../store/auth'
import LanguageToggle from '../components/LanguageToggle'
import ThemeToggle from '../components/ThemeToggle'
import Page from '../components/Page'
import { useToast } from '../components/Toast'
import { ShieldIcon } from '../components/icons'

const FAMILY = ['breast', 'colon', 'prostate', 'ovarian', 'liver', 'other']
const RISKS = ['smoking', 'alcohol', 'obesity', 'family_history', 'prior_cancer']
const SEXES = ['female', 'male', 'other', 'prefer_not_to_say']

export default function Profile() {
  const { t } = useTranslation()
  const { user, signout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [profile, setProfile] = useState({ age: '', sex: '', family_history: [], risk_factors: [] })
  const [reminders, setReminders] = useState([])
  const [billing, setBilling] = useState(null)
  const [saved, setSaved] = useState(false)
  const [deleteText, setDeleteText] = useState('')

  useEffect(() => {
    api.getProfile().then((p) => setProfile({
      age: p.age ?? '', sex: p.sex ?? '',
      family_history: p.family_history || [], risk_factors: p.risk_factors || [],
    })).catch(() => {})
    api.listReminders().then(setReminders).catch(() => {})
    api.billingStatus().then(setBilling).catch(() => {})
  }, [])

  const toggle = (key, v) => setProfile((p) => ({
    ...p, [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v],
  }))

  const save = async () => {
    await api.updateProfile({
      age: profile.age ? Number(profile.age) : null,
      sex: profile.sex || null,
      family_history: profile.family_history,
      risk_factors: profile.risk_factors,
    })
    setSaved(true)
    toast.success(t('toast.profileSaved'))
    setTimeout(() => setSaved(false), 2500)
  }

  const exportData = async () => {
    const data = await api.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'detectoma-my-data.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('toast.exported'))
  }

  const deleteAccount = async () => {
    await api.deleteAccount()
    setToken(null)
    signout()
    navigate('/', { replace: true })
  }

  return (
    <Page className="container">
      <h1>{t('profile.title')}</h1>

      <div className="card">
        <h3 className="mt-0">{t('profile.account')}</h3>
        <div className="field">
          <label>{t('profile.email')}</label>
          <input value={user?.email || ''} disabled />
        </div>
        <div className="field">
          <label>{t('profile.language')}</label>
          <div className="row spread">
            <LanguageToggle persist />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Plan / subscription */}
      <div className="card">
        <div className="row spread">
          <h3 className="mt-0" style={{ marginBottom: 0 }}>{t('pricing.navTitle')}</h3>
          <span className="plan-status-banner">
            <ShieldIcon width={15} height={15} />
            {billing?.plan === 'premium'
              ? (billing.plan_status === 'trialing'
                  ? t('pricing.trialActive', { days: billing.trial_days_left })
                  : t('pricing.premiumName'))
              : t('pricing.freeName')}
          </span>
        </div>
        <div className="row" style={{ marginTop: 16, gap: 10 }}>
          {billing?.plan === 'premium'
            ? <button className="btn btn-ghost" onClick={async () => {
                const u = await api.cancelPlan(); patchUser({ plan: u.plan })
                setBilling(await api.billingStatus()); toast.success(t('pricing.cancelled'))
              }}>{t('pricing.cancel')}</button>
            : <Link to="/pricing" className="btn btn-primary">{t('pricing.startTrial')}</Link>}
          <Link to="/pricing" className="btn btn-ghost">{t('pricing.manage')}</Link>
        </div>
      </div>

      <div className="card">
        <h3 className="mt-0">{t('profile.healthInfo')}</h3>
        {saved && <div className="form-success">{t('profile.saved')}</div>}
        <div className="grid-2">
          <div className="field">
            <label>{t('onboarding.age')}</label>
            <input type="number" min="0" max="120" value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })} />
          </div>
          <div className="field">
            <label>{t('onboarding.sex')}</label>
            <select value={profile.sex} onChange={(e) => setProfile({ ...profile, sex: e.target.value })}>
              <option value="">—</option>
              {SEXES.map((s) => <option key={s} value={s}>{t(`onboarding.sexOptions.${s}`)}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>{t('onboarding.familyHistory')}</label>
          <div className="chips">
            {FAMILY.map((f) => (
              <span key={f} className={`chip ${profile.family_history.includes(f) ? 'active' : ''}`}
                onClick={() => toggle('family_history', f)}>{t(`onboarding.familyOptions.${f}`)}</span>
            ))}
          </div>
        </div>
        <div className="field">
          <label>{t('onboarding.riskFactors')}</label>
          <div className="chips">
            {RISKS.map((r) => (
              <span key={r} className={`chip ${profile.risk_factors.includes(r) ? 'active' : ''}`}
                onClick={() => toggle('risk_factors', r)}>{t(`onboarding.riskOptions.${r}`)}</span>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={save}>{t('profile.save')}</button>
      </div>

      {reminders.length > 0 && (
        <div className="card">
          <h3 className="mt-0">{t('profile.reminders')}</h3>
          <table className="table">
            <tbody>
              {reminders.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.due_at).toLocaleDateString()}</td>
                  <td className="muted">{r.custom_message || t('results.setReminder')}</td>
                  <td style={{ textAlign: 'end' }}>
                    <button className="chip" onClick={async () => {
                      await api.deleteReminder(r.id)
                      setReminders((rs) => rs.filter((x) => x.id !== r.id))
                      toast.success(t('toast.reminderDeleted'))
                    }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h3 className="mt-0">{t('profile.dataTitle')}</h3>
        <button className="btn btn-ghost" onClick={exportData}>{t('profile.export')}</button>
      </div>

      <div className="card" style={{ borderColor: '#f3ccd2' }}>
        <h3 className="mt-0" style={{ color: 'var(--alert)' }}>{t('profile.deleteTitle')}</h3>
        <p className="muted small">{t('profile.deleteBody')}</p>
        <div className="field">
          <input placeholder={t('profile.deleteConfirm')} value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)} />
        </div>
        <button className="btn btn-danger" disabled={deleteText !== 'DELETE'} onClick={deleteAccount}>
          {t('profile.delete')}
        </button>
      </div>

      <button className="btn btn-ghost btn-block" onClick={() => { signout(); navigate('/') }}>
        {t('nav.signout')}
      </button>
    </Page>
  )
}
