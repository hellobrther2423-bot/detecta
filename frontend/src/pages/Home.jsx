import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useAuth } from '../store/auth'
import Disclaimer from '../components/Disclaimer'
import Page from '../components/Page'
import Reveal from '../components/Reveal'
import { DoodleSquiggle, DoodleStar, DoodleCircle } from '../components/Doodles'
import { UploadIcon, HistoryIcon, LearnIcon, ProfileIcon } from '../components/icons'

export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [reports, setReports] = useState([])

  useEffect(() => {
    api.listReports().then(setReports).catch(() => {})
  }, [])

  const recent = reports.slice(0, 4)
  const analyzed = reports.filter((r) => r.status === 'analyzed')
  const lastResult = analyzed[0]?.risk_result?.level
  const isDoctor = user?.role === 'doctor'

  const actions = [
    { to: '/app/upload', Icon: UploadIcon, key: 'upload', desc: 'uploadDesc' },
    { to: '/app/history', Icon: HistoryIcon, key: 'history', desc: 'historyDesc' },
    { to: '/app/learn', Icon: LearnIcon, key: 'learn', desc: 'learnDesc' },
    { to: '/pricing', Icon: ProfileIcon, key: 'pricingNav', desc: 'pricingDesc', ns: 'pricing' },
  ]

  return (
    <Page className="container container-wide">
      {/* Gradient hero banner */}
      <div className="home-hero">
        <span className="lp-doodle d-a"><DoodleSquiggle width={90} /></span>
        <span className="lp-doodle d-b"><DoodleStar width={40} /></span>
        <span className="lp-doodle d-c"><DoodleCircle width={60} /></span>
        <div className="home-hero-inner">
          <span className="home-hello-badge">{isDoctor ? t('home.doctorTitle') : t('landing.badge')}</span>
          <h1 className="home-hero-title">
            {user?.full_name ? t('app.greeting', { name: user.full_name.split(' ')[0] }) : t('app.name')}
          </h1>
          <p className="home-hero-sub">{isDoctor ? t('home.doctorBody') : t('app.tagline')}</p>
          <Link to="/app/upload" className="btn btn-lg home-hero-btn">{t('home.uploadCta')}</Link>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="stat-row stagger">
        <div className="stat-tile">
          <span className="stat-tile-num">{analyzed.length}</span>
          <span className="stat-tile-label">{t('home.totalReports')}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-num" style={{ fontSize: '1.3rem' }}>
            {lastResult ? t(`results.status.${lastResult === 'follow_up' ? 'high' : lastResult === 'monitor' ? 'elevated' : 'normal'}`) : t('home.noResult')}
          </span>
          <span className="stat-tile-label">{t('home.lastResult')}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-num" style={{ fontSize: '1.3rem' }}>
            {user?.plan === 'premium' ? t('pricing.premiumName') : t('pricing.freeName')}
          </span>
          <span className="stat-tile-label">{t('home.plan')}</span>
        </div>
      </div>

      {/* Quick actions */}
      <Reveal>
        <h3 className="section-head">{t('home.quickActions')}</h3>
        <div className="quick-grid">
          {actions.map(({ to, Icon, key, desc, ns }) => (
            <Link to={to} key={key} className="quick-card">
              <span className="quick-ico"><Icon width={24} height={24} /></span>
              <strong>{ns ? t(`${ns}.${key}`) : t(`nav.${key}`)}</strong>
              <span className="muted small">{t(`home.${desc}`)}</span>
            </Link>
          ))}
        </div>
      </Reveal>

      {/* Recent reports or empty state */}
      <Reveal>
        {reports.length > 0 ? (
          <div className="card">
            <h3 className="mt-0">{t('home.recent')}</h3>
            <table className="table">
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>{t(`upload.types.${r.report_type}`)}</td>
                    <td>
                      {r.risk_result && <span className={`pill pill-${r.risk_result.level === 'follow_up' ? 'high' : r.risk_result.level === 'monitor' ? 'elevated' : 'normal'}`}>
                        {t(`results.status.${r.risk_result.level === 'follow_up' ? 'high' : r.risk_result.level === 'monitor' ? 'elevated' : 'normal'}`)}
                      </span>}
                    </td>
                    <td style={{ textAlign: 'end' }}>
                      <Link to={r.status === 'analyzed' ? `/app/results/${r.id}` : `/app/review/${r.id}`}>
                        {t('history.view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card empty-state">
            <div className="empty-emoji">📄</div>
            <h3 className="mt-0">{t('home.emptyTitle')}</h3>
            <p className="muted">{t('home.emptyBody')}</p>
            <Link to="/app/upload" className="btn btn-primary">{t('home.uploadCta')}</Link>
          </div>
        )}
      </Reveal>

      {/* Tip card */}
      <div className="card tip-card">
        <span className="tip-icon">💡</span>
        <div>
          <strong>{t('home.tipTitle')}</strong>
          <p className="muted small mt-0" style={{ marginBottom: 0 }}>{t('home.tip')}</p>
        </div>
      </div>

      <Disclaimer compact />
    </Page>
  )
}
