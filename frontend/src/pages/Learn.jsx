import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import Disclaimer from '../components/Disclaimer'
import Page from '../components/Page'
import { SkeletonPage } from '../components/Skeleton'

// Education/Resources: articles + the marker catalog, all localized from the backend.
export default function Learn() {
  const { t, i18n } = useTranslation()
  const [articles, setArticles] = useState([])
  const [markers, setMarkers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.education(i18n.language), api.markers(i18n.language)])
      .then(([edu, mc]) => {
        setArticles(edu.articles)
        setMarkers(mc.markers)
      })
      .finally(() => setLoading(false))
  }, [i18n.language])

  if (loading) return <SkeletonPage cards={3} />

  return (
    <Page className="container">
      <h1>{t('learn.title')}</h1>
      <p className="muted">{t('learn.subtitle')}</p>

      <div className="stagger">
        {articles.map((a) => (
          <div className="card" key={a.id}>
            <h3 className="mt-0">{a.title}</h3>
            <p className="muted mt-0">{a.body}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="mt-0">{t('results.flaggedTitle')}</h3>
        <div className="stack">
          {markers.map((m) => (
            <div key={m.marker_key} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div className="row spread">
                <strong>{m.name}</strong>
                <span className="muted small">
                  {m.reference_low ?? 0}–{m.reference_high} {m.unit}
                </span>
              </div>
              <p className="muted small mt-0" style={{ marginBottom: 0 }}>{m.explanations?.normal}</p>
            </div>
          ))}
        </div>
      </div>

      <Disclaimer compact />
    </Page>
  )
}
