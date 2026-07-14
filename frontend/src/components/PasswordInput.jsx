import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EyeIcon, EyeOffIcon } from './icons'

// Password field with a show/hide toggle so users can verify what's actually in
// the field (e.g. after paste or a browser-suggested password). The eye button
// sits on the trailing edge and mirrors automatically in RTL via logical props.
export default function PasswordInput({ value, onChange, autoComplete = 'current-password', ...rest }) {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  return (
    <div className="pw-wrap">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="pw-input"
        {...rest}
      />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? t('common.hidePassword') : t('common.showPassword')}
        title={show ? t('common.hidePassword') : t('common.showPassword')}
        tabIndex={-1}
      >
        {show ? <EyeOffIcon width={19} height={19} /> : <EyeIcon width={19} height={19} />}
      </button>
    </div>
  )
}
