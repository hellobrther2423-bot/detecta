import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import Disclaimer from '../components/Disclaimer'
import Page from '../components/Page'
import { useToast } from '../components/Toast'
import { SkeletonPage } from '../components/Skeleton'

// Users confirm/correct extracted values before analysis. Marker names are shown
// localized (fetched from the content endpoint) for trust and clarity.
export default function Review() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [names, setNames] = useState({})
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getReport(id), api.markers(i18n.language)])
      .then(([report, content]) => {
        const nameMap = {}
        content.markers.forEach((m) => { nameMap[m.marker_key] = m })
        setNames(nameMap)
        setRows(report.markers.map((m) => ({
          marker_key: m.marker_key,
          value: m.value ?? '',
          unit: m.unit ?? (nameMap[m.marker_key]?.unit ?? ''),
          confidence: m.confidence,
        })))
      })
      .finally(() => setLoading(false))
  }, [id, i18n.language])

  const setValue = (i, v) => setRows((r) => r.map((row, idx) => idx === i ? { ...row, value: v } : row))

  const analyze = async () => {
    setBusy(true)
    try {
      await api.reviewReport(id, {
        markers: rows.map((r) => ({
          marker_key: r.marker_key,
          value: r.value === '' ? null : Number(r.value),
          unit: r.unit || null,
        })),
      })
      await api.analyzeReport(id)
      toast.success(t('toast.analyzed'))
      navigate(`/app/results/${id}`, { replace: true })
    } catch {
      toast.error(t('toast.error'))
    } finally { setBusy(false) }
  }

  if (loading) return <SkeletonPage cards={2} />

  return (
    <Page className="container">
      <h1>{t('review.title')}</h1>
      <p className="muted">{t('review.subtitle')}</p>

      <div className="card">
        {rows.length === 0 ? (
          <p className="muted">{t('review.noMarkers')}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t('review.marker')}</th>
                <th>{t('review.value')}</th>
                <th>{t('review.unit')}</th>
                <th>{t('review.confidence')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.marker_key}>
                  <td><strong>{names[row.marker_key]?.name || row.marker_key}</strong></td>
                  <td style={{ maxWidth: 120 }}>
                    <input type="number" step="any" value={row.value}
                      onChange={(e) => setValue(i, e.target.value)}
                      style={{ padding: '8px 10px' }} />
                  </td>
                  <td className="muted">{row.unit}</td>
                  <td className="muted small">
                    {row.confidence != null ? `${Math.round(row.confidence * 100)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="btn btn-primary btn-block btn-lg" onClick={analyze} disabled={busy}>
        {busy ? t('common.loading') : t('review.analyze')}
      </button>
      <div style={{ marginTop: 16 }}><Disclaimer compact /></div>
    </Page>
  )
}
