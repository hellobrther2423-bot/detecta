import { useTranslation } from 'react-i18next'
import { useTheme } from '../store/theme'

// Animated sun/moon theme toggle.
export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { t } = useTranslation()
  const dark = theme === 'dark'
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={dark ? t('common.lightMode') : t('common.darkMode')}
      title={dark ? t('common.lightMode') : t('common.darkMode')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)', transform: dark ? 'rotate(0deg)' : 'rotate(360deg)' }}>
        {dark ? (
          // moon
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        ) : (
          // sun
          <>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </>
        )}
      </svg>
    </button>
  )
}
