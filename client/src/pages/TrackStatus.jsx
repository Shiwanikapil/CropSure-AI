import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { authHeaders } from '../api'
import { useLanguage } from '../context/LanguageContext'

function TrackStatus() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [message, setMessage] = useState('')
  const { language, t } = useLanguage()
  const hi = language === 'hi'

  useEffect(() => {
    const token = localStorage.getItem('farmerToken')
    if (!token) {
      navigate('/login', { state: { from: '/track-status' } })
      return
    }
    api.get('/reports/mine', { headers: authHeaders(token) })
      .then((response) => setReports(response.data))
      .catch((error) => setMessage(error.response?.data?.message || 'Unable to load reports. Please sign in again.'))
  }, [navigate])

  const downloadOfficerReport = async (report) => {
    try {
      const response = await api.get(`/reports/${report._id}/officer-report`, {
        headers: authHeaders(localStorage.getItem('farmerToken')),
        responseType: 'blob'
      })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `crop-loss-officer-report-${report._id}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to download the officer report. Please try again.')
    }
  }
  const formatDate = (value) => value ? new Date(value).toLocaleString(hi ? 'hi-IN' : 'en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'Not available'
  const getTrackingStage = (status = '') => {
    if (['approved', 'rejected'].includes(status)) return 3
    if (['under_review', 'more_information_needed'].includes(status)) return 2
    return 1
  }
  return <div className="page-container track-status-page"><div className="page-shell"><section className="page-card track-status-card">
    <div className="track-reports-column"><div className="track-page-heading"><div><p className="page-kicker">{t('reportTracking')}</p><h1>{hi ? 'अपनी रिपोर्ट की प्रगति देखें' : 'Track your crop reports'}</h1><p>{hi ? 'हर रिपोर्ट की समीक्षा और निर्णय की स्थिति यहाँ देखें।' : 'Follow each report from submission through officer review and decision.'}</p></div><span className="track-report-count">{reports.length} {hi ? 'रिपोर्ट' : reports.length === 1 ? 'report' : 'reports'}</span></div>
      <div className="status-list">{reports.length === 0 ? <div className="status-item"><span>{hi ? 'अभी कोई रिपोर्ट जमा नहीं की गई।' : 'No reports submitted yet.'}</span><span className="status-pill">{hi ? 'लंबित' : 'Pending'}</span></div> : reports.map((report) => <article className="status-item farmer-report-status" key={report._id}>
        <div className="report-status-content">
          <div className="report-status-heading"><div><span className="report-date-label">{hi ? 'जमा की गई' : 'SUBMITTED'} · {formatDate(report.createdAt)}</span><strong>{report.cropType} {hi ? 'फसल नुकसान रिपोर्ट' : 'crop-loss report'}</strong></div><span className={`status-pill status-${report.status}`}>{report.status.replaceAll('_', ' ')}</span></div>
          <div className="report-tracking-progress" aria-label={`${hi ? 'रिपोर्ट की स्थिति' : 'Report progress'}: ${report.status.replaceAll('_', ' ')}`}>
            {[
              hi ? 'रिपोर्ट जमा' : 'Submitted',
              hi ? 'अधिकारी समीक्षा' : 'Officer review',
              hi ? 'निर्णय' : 'Decision'
            ].map((label, index) => {
              const stage = getTrackingStage(report.status)
              const step = index + 1
              return <div className={`report-progress-step ${step < stage ? 'complete' : step === stage ? 'current' : ''}`} key={label}><span>{step < stage ? '✓' : step}</span><strong>{label}</strong></div>
            })}
          </div>
          <div className="report-meta-grid">
            <div className="report-meta-item"><span>{hi ? 'रिपोर्ट ID' : 'Report ID'}</span><strong>{report._id}</strong></div>
            <div className="report-meta-item"><span>{hi ? 'नुकसान' : 'Damage'}</span><strong>{report.damagePercent}% {hi ? 'अनुमानित' : 'estimated'}</strong></div>
            <div className="report-meta-item report-meta-wide"><span>{hi ? 'खेत' : 'Field'}</span><strong>{report.address || `${Number(report.lat).toFixed(4)}, ${Number(report.lng).toFixed(4)}`}</strong></div>
            <div className="report-meta-item"><span>{hi ? 'जमा करने की तारीख' : 'Submitted'}</span><strong>{formatDate(report.createdAt)}</strong></div>
            <div className="report-meta-item"><span>{hi ? 'अधिकारी का अंतिम अपडेट' : 'Officer last updated'}</span><strong>{report.officerUpdatedAt ? formatDate(report.officerUpdatedAt) : (hi ? 'अधिकारी समीक्षा की प्रतीक्षा है' : 'Awaiting officer review')}</strong></div>
          </div>
          {report.aiAnalysis ? <div className="report-ai-finding"><span>{hi ? 'AI विश्लेषण' : 'AI finding'}</span><strong>{report.aiAnalysis.damageType || (hi ? 'विश्लेषण पूरा हुआ' : 'Analysis completed')}</strong><b>{report.aiAnalysis.estimatedDamagePercent}% {hi ? 'अनुमानित नुकसान' : 'estimated damage'}</b></div> : null}
          {report.officerNote ? <div className="officer-response"><b>{hi ? 'अधिकारी का उत्तर' : 'Officer response'}</b><span>{report.officerNote}</span></div> : <div className="officer-response pending-response"><b>{hi ? 'अधिकारी का उत्तर' : 'Officer response'}</b><span>{hi ? 'समीक्षा जारी है। अधिकारी ने अभी नोट नहीं जोड़ा है।' : 'Review is in progress. The officer has not added a note yet.'}</span></div>}
          {report.officerReportPdf ? <button type="button" className="officer-pdf-download" onClick={() => downloadOfficerReport(report)}>{hi ? 'अधिकारी रिपोर्ट PDF डाउनलोड करें' : 'Download Officer Report PDF'}</button> : null}
        </div>
      </article>)}</div>
      {message ? <p className="status-message">{message}</p> : null}
    </div>
  </section><div className="page-actions"><button type="button" onClick={() => navigate('/')}>{t('backHome')}</button><button type="button" onClick={() => navigate('/login')}>{t('farmerLogin')}</button></div></div></div>
}

export default TrackStatus
