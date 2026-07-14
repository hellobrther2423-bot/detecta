import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import Disclaimer from '../components/Disclaimer'
import Page from '../components/Page'
import AnimatedNumber from '../components/AnimatedNumber'
import { SkeletonPage } from '../components/Skeleton'

// Results page: overall indicator + per-marker breakdown with localized, natively
// authored explanations (not machine-translated). Disclaimer repeated top and bottom.
export default function Results() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [levels, setLevels] = useState({})
  const [markerContent, setMarkerContent] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getReport(id),
      api.resultsContent(i18n.language),
      api.markers(i18n.language),
    ]).then(([rep, rc, mc]) => {
      setReport(rep)
      setLevels(rc.levels)
      const map = {}
      mc.markers.forEach((m) => { map[m.marker_key] = m })
      setMarkerContent(map)
    }).finally(() => setLoading(false))
  }, [id, i18n.language])

  if (loading) return <SkeletonPage cards={3} />
  if (!report || !report.risk_result) return <div className="container muted">{t('history.empty')}</div>

  const level = report.risk_result.level
  const flagged = report.risk_result.flagged || []
  const findDoctorUrl = 'https://www.google.com/maps/search/oncologist+near+me'

  return (
    <Page className="container">
      <h1>{t('results.title')}</h1>
      <Disclaimer />

      <div className={`level-banner level-${level}`} style={{ marginTop: 16 }}>
        <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {t('results.level')}
        </div>
        <h2 className="level-title">{levels[level]?.title}</h2>
        <p className="mt-0">{levels[level]?.summary}</p>
      </div>

      <div className="card">
        <h3 className="mt-0">{t('results.flaggedTitle')}</h3>
        <table className="table">
          <thead>
            <tr>
              <th>{t('review.marker')}</th>
              <th>{t('review.value')}</th>
              <th>{t('results.reference')}</th>
              <th>{t('history.result')}</th>
            </tr>
          </thead>
          <tbody>
            {flagged.map((f) => (
              <tr key={f.marker_key}>
                <td><strong>{markerContent[f.marker_key]?.name || f.marker_key}</strong></td>
                <td><AnimatedNumber value={f.value} /> {f.unit}</td>
                <td className="muted small">
                  {f.reference_low ?? 0}–{f.reference_high} {f.unit}
                </td>
                <td><span className={`pill pill-${f.status}`}>{t(`results.status.${f.status}`)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-marker plain-language explanations, natively localized. */}
      <div className="card">
        <h3 className="mt-0">{t('results.explanationTitle')}</h3>
        <div className="stack stagger">
          {flagged.map((f) => {
            const expl = markerContent[f.marker_key]?.explanations?.[f.status]
            if (!expl) return null
            return (
              <div key={f.marker_key} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div className="row spread">
                  <strong>{markerContent[f.marker_key]?.name || f.marker_key}</strong>
                  <span className={`pill pill-${f.status}`}>{t(`results.status.${f.status}`)}</span>
                </div>
                <p className="muted mt-0" style={{ marginBottom: 0 }}>{expl}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="stack">
        <a className="btn btn-primary btn-block" href={findDoctorUrl} target="_blank" rel="noreferrer">
          {t('results.findDoctor')}
        </a>
        <Link className="btn btn-ghost btn-block" to="/app/history">{t('results.viewHistory')}</Link>
      </div>

      <div style={{ marginTop: 16 }}><Disclaimer compact /></div>
    </Page>
  )
}
