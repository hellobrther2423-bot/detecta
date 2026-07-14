import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { CheckIcon } from '../components/icons'

// Shows OCR progress, then routes to the review screen. The actual extraction is
// a single backend call; we animate the perceived steps around it.
const STEPS = ['uploaded', 'extracting', 'review']

export default function Processing() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [stage, setStage] = useState(0)
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    setStage(1)
    api.extractReport(id)
      .then(() => {
        setStage(2)
        setTimeout(() => navigate(`/app/review/${id}`, { replace: true }), 700)
      })
      .catch(() => setError(t('auth.errors.generic')))
  }, [id, navigate, t])

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card card-pad-lg">
        <h1 className="mt-0">{t('processing.title')}</h1>
        <p className="muted">{t('processing.wait')}</p>
        <div className="steps" style={{ marginTop: 20 }}>
          {STEPS.map((s, i) => (
            <div key={s} className={`step ${i < stage ? 'done' : i === stage ? 'active' : ''}`}>
              <span className="step-dot">
                {i < stage ? <CheckIcon width={16} height={16} />
                  : i === stage ? <span className="spinner" /> : i + 1}
              </span>
              <span>{t(`processing.step_${s}`)}</span>
            </div>
          ))}
        </div>
        {error && <div className="form-error" style={{ marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  )
}
