import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import Disclaimer from '../components/Disclaimer'
import Page from '../components/Page'
import { useToast } from '../components/Toast'

const TYPES = ['blood_panel', 'tumor_markers', 'biopsy', 'pathology', 'other']

export default function Upload() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const [file, setFile] = useState(null)
  const [reportType, setReportType] = useState('tumor_markers')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (ev) => {
    ev.preventDefault()
    if (!file) return
    setBusy(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('report_type', reportType)
      const report = await api.uploadReport(fd)
      toast.success(t('toast.uploaded'))
      navigate(`/app/processing/${report.id}`)
    } catch (err) {
      setError(err.detail === 'file_too_large' ? 'File is too large (max 15MB).'
        : err.detail === 'unsupported_file_type' ? 'Please upload an image or PDF.'
        : t('auth.errors.generic'))
      setBusy(false)
    }
  }

  return (
    <Page className="container">
      <h1>{t('upload.title')}</h1>

      <div className="card">
        <h3 className="mt-0">{t('upload.guidanceTitle')}</h3>
        <ul className="muted stack" style={{ paddingInlineStart: 20 }}>
          <li>{t('upload.g1')}</li>
          <li>{t('upload.g2')}</li>
          <li>{t('upload.g3')}</li>
          <li>{t('upload.g4')}</li>
        </ul>
      </div>

      <form className="card" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <div className="field">
          <label>{t('upload.reportType')}</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {TYPES.map((ty) => <option key={ty} value={ty}>{t(`upload.types.${ty}`)}</option>)}
          </select>
        </div>
        <div className="field">
          <label>{t('upload.choose')}</label>
          <input type="file" accept="image/*,application/pdf" capture="environment"
            onChange={(e) => setFile(e.target.files[0] || null)} />
          {file && <div className="small muted" style={{ marginTop: 6 }}>{t('upload.selected')}: {file.name}</div>}
        </div>
        <button className="btn btn-primary btn-block btn-lg" disabled={!file || busy}>
          {busy ? t('upload.uploading') : t('upload.submit')}
        </button>
      </form>

      <Disclaimer compact />
    </Page>
  )
}
