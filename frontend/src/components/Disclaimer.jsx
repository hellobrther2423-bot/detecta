import { useTranslation } from 'react-i18next'

// Repeated, prominent reminder that this is not a diagnosis.
export default function Disclaimer({ compact = false }) {
  const { t } = useTranslation()
  return (
    <div className={`disclaimer ${compact ? 'compact' : ''}`} role="note">
      <span aria-hidden="true">ⓘ</span>
      <span>{t('app.disclaimer')}</span>
    </div>
  )
}
