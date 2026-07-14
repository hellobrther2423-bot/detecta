import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, getToken } from '../api/client'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'
import LanguageToggle from '../components/LanguageToggle'
import ThemeToggle from '../components/ThemeToggle'
import Disclaimer from '../components/Disclaimer'
import { CheckIcon, ShieldIcon } from '../components/icons'

const FREE_FEATURES = ['feFree1', 'feFree2', 'feFree3', 'feFree4']
const PREMIUM_FEATURES = ['fePrem1', 'fePrem2', 'fePrem3', 'fePrem4', 'fePrem5', 'fePrem6']

export default function Pricing() {
  const { t } = useTranslation()
  const { user, patchUser, refresh } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [cycle, setCycle] = useState('monthly')
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const signedIn = Boolean(getToken())

  useEffect(() => {
    if (signedIn) api.billingStatus().then(setStatus).catch(() => {})
  }, [signedIn])

  const onPremium = status && status.plan === 'premium'
  const yearly = cycle === 'yearly'
  const price = yearly ? t('pricing.premiumPriceYear') : t('pricing.premiumPrice')

  const startTrial = async () => {
    if (!signedIn) { navigate('/signup'); return }
    setBusy(true)
    try {
      const updated = await api.subscribe({ billing_cycle: cycle })
      patchUser({ plan: updated.plan, plan_status: updated.plan_status })
      const s = await api.billingStatus()
      setStatus(s)
      toast.success(t('pricing.upgraded'))
    } catch {
      toast.error(t('toast.error'))
    } finally { setBusy(false) }
  }

  const cancel = async () => {
    setBusy(true)
    try {
      const updated = await api.cancelPlan()
      patchUser({ plan: updated.plan, plan_status: updated.plan_status })
      setStatus(await api.billingStatus())
      toast.success(t('pricing.cancelled'))
    } catch {
      toast.error(t('toast.error'))
    } finally { setBusy(false) }
  }

  return (
    <div>
      {/* Nav */}
      <nav className="lp-nav card-glass scrolled">
        <Link to={signedIn ? '/app' : '/'} className="lp-brand" style={{ textDecoration: 'none' }}>
          <span className="lp-logo">◎</span><span>{t('app.name')}</span>
        </Link>
        <div className="row">
          <LanguageToggle persist={signedIn} />
          <ThemeToggle />
          {signedIn
            ? <Link to="/app" className="btn btn-ghost" style={{ padding: '9px 18px' }}>{t('nav.home')}</Link>
            : <Link to="/signin" className="btn btn-ghost" style={{ padding: '9px 18px' }}>{t('auth.signIn')}</Link>}
        </div>
      </nav>

      <section className="lp-section">
        <div className="lp-center" style={{ marginBottom: 8 }}>
          <div className="lp-eyebrow">{t('pricing.eyebrow')}</div>
          <h1 className="lp-h2" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)' }}>{t('pricing.title')}</h1>
          <p className="lp-lead lp-center">{t('pricing.subtitle')}</p>
        </div>

        {/* Current plan banner (signed-in) */}
        {status && (
          <div className="lp-center" style={{ marginBottom: 8 }}>
            <span className="plan-status-banner">
              <ShieldIcon width={16} height={16} />
              {status.plan === 'premium'
                ? (status.plan_status === 'trialing'
                    ? t('pricing.trialActive', { days: status.trial_days_left })
                    : t('pricing.premiumActive'))
                : `${t('pricing.currentPlan')}: ${t('pricing.freeName')}`}
            </span>
          </div>
        )}

        {/* Billing cycle toggle */}
        <div className="lp-center" style={{ marginTop: 24 }}>
          <div className="pricing-toggle">
            <button className={!yearly ? 'active' : ''} onClick={() => setCycle('monthly')}>{t('pricing.monthly')}</button>
            <button className={yearly ? 'active' : ''} onClick={() => setCycle('yearly')}>
              {t('pricing.yearly')} <span className="pricing-save">· {t('pricing.yearlySave')}</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="pricing-grid">
          {/* Free */}
          <div className="plan-card">
            <h3 className="mt-0">{t('pricing.freeName')}</h3>
            <p className="muted small mt-0">{t('pricing.freeTagline')}</p>
            <div className="plan-price">
              <span className="amount">{t('pricing.freePrice')}</span>
              <span className="cur">{t('pricing.currency')}</span>
            </div>
            <ul className="plan-features">
              {FREE_FEATURES.map((f) => (
                <li key={f}><span className="plan-check"><CheckIcon width={13} height={13} /></span>{t(`pricing.${f}`)}</li>
              ))}
            </ul>
            {signedIn
              ? (onPremium
                  ? <button className="btn btn-ghost btn-block" disabled={busy} onClick={cancel}>{t('pricing.cancel')}</button>
                  : <button className="btn btn-ghost btn-block" disabled>{t('pricing.currentPlan')}</button>)
              : <Link to="/signup" className="btn btn-ghost btn-block">{t('landing.getStarted')}</Link>}
          </div>

          {/* Premium */}
          <div className="plan-card featured">
            <span className="plan-badge">{t('pricing.mostPopular')}</span>
            <h3 className="mt-0">{t('pricing.premiumName')}</h3>
            <p className="muted small mt-0">{t('pricing.premiumTagline')}</p>
            <div className="plan-price">
              <span className="amount">{price}</span>
              <span className="cur">{t('pricing.currency')}</span>
              <span className="per">{yearly ? t('pricing.perYear') : t('pricing.perMonth')}</span>
            </div>
            <span className="pill pill-normal" style={{ alignSelf: 'flex-start' }}>{t('pricing.trialBadge')}</span>
            <ul className="plan-features">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f}><span className="plan-check"><CheckIcon width={13} height={13} /></span>{t(`pricing.${f}`)}</li>
              ))}
            </ul>
            {onPremium
              ? <button className="btn btn-ghost btn-block" disabled={busy} onClick={cancel}>{t('pricing.cancel')}</button>
              : <button className="btn btn-primary btn-block btn-lg" disabled={busy} onClick={startTrial}>
                  {busy ? t('common.loading') : t('pricing.startTrial')}
                </button>}
          </div>
        </div>

        <p className="muted small center" style={{ marginTop: 20 }}>{t('pricing.note')}</p>
        <div style={{ maxWidth: 760, margin: '28px auto 0' }}><Disclaimer compact /></div>
      </section>
    </div>
  )
}
