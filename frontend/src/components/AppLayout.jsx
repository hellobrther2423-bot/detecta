import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/auth'
import LanguageToggle from './LanguageToggle'
import ThemeToggle from './ThemeToggle'
import { HomeIcon, UploadIcon, HistoryIcon, LearnIcon, ProfileIcon } from './icons'

// Dashboard layout: a premium sidebar on desktop, a bottom nav on mobile.
// Everything mirrors automatically for Arabic (dir=rtl) via logical properties.
const items = [
  { to: '/app', end: true, key: 'home', Icon: HomeIcon },
  { to: '/app/upload', key: 'upload', Icon: UploadIcon },
  { to: '/app/history', key: 'history', Icon: HistoryIcon },
  { to: '/app/learn', key: 'learn', Icon: LearnIcon },
  { to: '/app/profile', key: 'profile', Icon: ProfileIcon },
]

export default function AppLayout() {
  const { t } = useTranslation()
  const { user, signout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const doSignout = () => { signout(); navigate('/') }

  return (
    <div className={`dash ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar (desktop) */}
      <aside className="sidebar card-glass">
        <div className="sidebar-brand">
          <span className="lp-logo">◎</span>
          <span className="sidebar-brand-name">{t('app.name')}</span>
          <button className="sidebar-toggle" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {items.map(({ to, end, key, Icon }) => (
            <NavLink key={key} to={to} end={end} className="sidebar-link"
              title={t(`nav.${key}`)}>
              <span className="sidebar-ico"><Icon width={21} height={21} /></span>
              <span className="sidebar-label">{t(`nav.${key}`)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user">
            <span className="sidebar-avatar">{(user?.full_name || user?.email || '?').charAt(0).toUpperCase()}</span>
            <div className="sidebar-user-info">
              <strong>{user?.full_name?.split(' ')[0] || t('nav.profile')}</strong>
              <span className="muted small">{user?.plan === 'premium' ? t('pricing.premiumName') : t('pricing.freeName')}</span>
            </div>
          </div>
          <div className="sidebar-controls">
            <LanguageToggle persist />
            <ThemeToggle />
          </div>
          <button className="btn btn-ghost btn-block" onClick={doSignout} style={{ padding: '9px' }}>
            {t('nav.signout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="mobile-nav card-glass" aria-label="Main">
        {items.map(({ to, end, key, Icon }) => (
          <NavLink key={key} to={to} end={end} className="mobile-link">
            {({ isActive }) => (
              <>
                <span className={`mobile-ico ${isActive ? 'active' : ''}`}><Icon width={22} height={22} /></span>
                <span className="mobile-label">{t(`nav.${key}`)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
