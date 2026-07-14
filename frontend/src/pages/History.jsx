import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import TrendChart from '../components/TrendChart'
import { DonutChart, BarList } from '../components/Charts'
import Page from '../components/Page'
import Reveal from '../components/Reveal'
import { SkeletonPage } from '../components/Skeleton'

export default function History() {
  const { t, i18n } = useTranslation()
  const [reports, setReports] = useState([])
  const [trends, setTrends] = useState([])
  const [markerContent, setMarkerContent] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.listReports(), api.trends(), api.markers(i18n.language)])
      .then(([r, tr, mc]) => {
        setReports(r)
        setTrends(tr.filter((s) => s.points.length >= 1))
        const map = {}
        mc.markers.forEach((m) => { map[m.marker_key] = m })
        setMarkerContent(map)
      })
      .finally(() => setLoading(false))
  }, [i18n.language])

  // Derive analytics from analyzed reports.
  const analytics = useMemo(() => {
    const analyzed = reports.filter((r) => r.status === 'analyzed' && r.risk_result)
    const levels = { normal: 0, monitor: 0, follow_up: 0 }
    const flaggedCount = {}
    let flaggedReports = 0
    analyzed.forEach((r) => {
      const lvl = r.risk_result.level
      if (levels[lvl] != null) levels[lvl] += 1
      const flagged = (r.risk_result.flagged || []).filter((f) => f.status !== 'normal')
      if (flagged.length) flaggedReports += 1
      flagged.forEach((f) => { flaggedCount[f.marker_key] = (flaggedCount[f.marker_key] || 0) + 1 })
    })
    const topMarkers = Object.entries(flaggedCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([key, value]) => ({ label: markerContent[key]?.name || key, value }))
    return {
      count: analyzed.length,
      levels,
      topMarkers,
      flaggedRate: analyzed.length ? Math.round((flaggedReports / analyzed.length) * 100) : 0,
      markersTracked: trends.length,
    }
  }, [reports, trends, markerContent])

  if (loading) return <SkeletonPage cards={3} />

  const donutSegments = [
    { label: t('results.status.normal'), value: analytics.levels.normal, color: 'var(--normal)' },
    { label: t('results.status.elevated'), value: analytics.levels.monitor, color: 'var(--monitor)' },
    { label: t('results.status.high'), value: analytics.levels.follow_up, color: 'var(--alert)' },
  ]
  const hasInsights = analytics.count > 0

  return (
    <Page className="container container-wide">
      <h1>{t('history.title')}</h1>

      {reports.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-emoji">📈</div>
          <p className="muted">{t('history.empty')}</p>
          <Link to="/app/upload" className="btn btn-primary">{t('history.uploadFirst')}</Link>
        </div>
      ) : (
        <>
          {/* Insights / analytics */}
          <Reveal>
            <h3 className="section-head">{t('history.insightsTitle')}</h3>
            {hasInsights ? (
              <>
                <div className="stat-row stagger">
                  <div className="stat-tile">
                    <span className="stat-tile-num">{analytics.count}</span>
                    <span className="stat-tile-label">{t('history.totalReports')}</span>
                  </div>
                  <div className="stat-tile">
                    <span className="stat-tile-num">{analytics.flaggedRate}%</span>
                    <span className="stat-tile-label">{t('history.flaggedRate')}</span>
                  </div>
                  <div className="stat-tile">
                    <span className="stat-tile-num">{analytics.markersTracked}</span>
                    <span className="stat-tile-label">{t('history.markersTracked')}</span>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <h3 className="mt-0">{t('history.riskDistribution')}</h3>
                    <div className="donut-legend-row">
                      <DonutChart
                        segments={donutSegments}
                        centerLabel={analytics.count}
                        centerSub={t('history.totalReports')}
                      />
                      <div className="donut-legend">
                        {donutSegments.map((s) => (
                          <div className="donut-legend-item" key={s.label}>
                            <span className="donut-dot" style={{ background: s.color }} />
                            <span>{s.label}</span>
                            <strong style={{ marginInlineStart: 'auto' }}>{s.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="mt-0">{t('history.mostFlagged')}</h3>
                    {analytics.topMarkers.length
                      ? <BarList items={analytics.topMarkers} />
                      : <p className="muted small">{t('results.status.normal')} ✓</p>}
                  </div>
                </div>
              </>
            ) : (
              <div className="card"><p className="muted mt-0" style={{ marginBottom: 0 }}>{t('history.noInsights')}</p></div>
            )}
          </Reveal>

          {/* Trends */}
          {trends.length > 0 && (
            <Reveal>
              <div className="card">
                <h3 className="mt-0">{t('history.trendsTitle')}</h3>
                <div className="stack">
                  {trends.map((s) => {
                    const mc = markerContent[s.marker_key]
                    return (
                      <div key={s.marker_key}>
                        <div className="row spread">
                          <strong>{mc?.name || s.marker_key}</strong>
                          <span className="muted small">{mc?.unit}</span>
                        </div>
                        <TrendChart series={s} referenceHigh={mc?.reference_high} referenceLow={mc?.reference_low ?? 0} />
                      </div>
                    )
                  })}
                </div>
              </div>
            </Reveal>
          )}

          {/* All reports table */}
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('history.date')}</th>
                  <th>{t('history.type')}</th>
                  <th>{t('history.result')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>{t(`upload.types.${r.report_type}`)}</td>
                    <td>
                      {r.risk_result
                        ? <span className={`pill pill-${r.risk_result.level === 'follow_up' ? 'high' : r.risk_result.level === 'monitor' ? 'elevated' : 'normal'}`}>
                            {t(`results.status.${r.risk_result.level === 'follow_up' ? 'high' : r.risk_result.level === 'monitor' ? 'elevated' : 'normal'}`)}
                          </span>
                        : <span className="muted small">{t(`processing.step_${r.status}`, r.status)}</span>}
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
        </>
      )}
    </Page>
  )
}
