import { useTranslation } from 'react-i18next'
import { useLanguageSwitch } from '../store/language'

// Language toggle with smooth animated transition (crossfade + RTL flip).
export default function LanguageToggle({ persist = false }) {
  const { i18n } = useTranslation()
  const { switchLanguage, transitioning } = useLanguageSwitch()
  const current = i18n.language

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <button
        className={`lang-pill ${current === 'en' ? 'active' : ''}`}
        onClick={() => switchLanguage('en', { persist })}
        disabled={transitioning}
      >EN</button>
      <button
        className={`lang-pill ${current === 'ar' ? 'active' : ''}`}
        onClick={() => switchLanguage('ar', { persist })}
        disabled={transitioning}
      >ع</button>
      <span className={`lang-slider ${current === 'ar' ? 'right' : ''}`} aria-hidden="true" />
    </div>
  )
}
