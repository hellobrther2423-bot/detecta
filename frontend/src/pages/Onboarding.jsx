import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { useAuth } from '../store/auth'
import Disclaimer from '../components/Disclaimer'
import Page from '../components/Page'

const FAMILY = ['breast', 'colon', 'prostate', 'ovarian', 'liver', 'other']
const RISKS = ['smoking', 'alcohol', 'obesity', 'family_history', 'prior_cancer']
const SEXES = ['female', 'male', 'other', 'prefer_not_to_say']

export default function Onboarding() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { patchUser } = useAuth()
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [family, setFamily] = useState([])
  const [risks, setRisks] = useState([])
  const [busy, setBusy] = useState(false)

  const toggle = (list, setList, v) =>
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const save = async () => {
    setBusy(true)
    try {
      await api.updateProfile({
        age: age ? Number(age) : null,
        sex: sex || null,
        family_history: family,
        risk_factors: risks,
      })
      patchUser({ onboarding_complete: true })
      navigate('/app')
    } finally { setBusy(false) }
  }

  const skip = async () => {
    setBusy(true)
    try {
      await api.skipOnboarding()
      patchUser({ onboarding_complete: true })
      navigate('/app')
    } finally { setBusy(false) }
  }

  return (
    <Page className="container" style={{ maxWidth: 620 }}>
      <div className="card card-pad-lg">
        <h1 className="mt-0">{t('onboarding.title')}</h1>
        <p className="muted">{t('onboarding.subtitle')}</p>

        <div className="grid-2">
          <div className="field">
            <label>{t('onboarding.age')}</label>
            <input type="number" min="0" max="120" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('onboarding.sex')}</label>
            <select value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="">—</option>
              {SEXES.map((s) => <option key={s} value={s}>{t(`onboarding.sexOptions.${s}`)}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>{t('onboarding.familyHistory')}</label>
          <div className="chips">
            {FAMILY.map((f) => (
              <span key={f} className={`chip ${family.includes(f) ? 'active' : ''}`}
                onClick={() => toggle(family, setFamily, f)}>
                {t(`onboarding.familyOptions.${f}`)}
              </span>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t('onboarding.riskFactors')}</label>
          <div className="chips">
            {RISKS.map((r) => (
              <span key={r} className={`chip ${risks.includes(r) ? 'active' : ''}`}
                onClick={() => toggle(risks, setRisks, r)}>
                {t(`onboarding.riskOptions.${r}`)}
              </span>
            ))}
          </div>
        </div>

        <div className="row row-wrap" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{t('onboarding.save')}</button>
          <button className="btn btn-ghost" onClick={skip} disabled={busy}>{t('onboarding.skip')}</button>
        </div>
      </div>
      <Disclaimer compact />
    </Page>
  )
}
