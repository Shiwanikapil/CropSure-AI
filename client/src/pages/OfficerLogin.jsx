import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { authHeaders } from '../api'
import OfficerLocationGlobe from '../components/OfficerLocationGlobe'

const statuses = ['submitted', 'under_review', 'more_information_needed', 'approved', 'rejected']

function OfficerLogin() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ officerId: '', password: '' })
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('officerToken')))
  const [error, setError] = useState('')
  const [reports, setReports] = useState([])
  const [savingId, setSavingId] = useState('')
  const [analyzingId, setAnalyzingId] = useState('')
  const [generatingPdfId, setGeneratingPdfId] = useState('')
  const [deletingFarmerId, setDeletingFarmerId] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const loadReports = async (token) => {
    const response = await api.get('/reports', { headers: authHeaders(token) })
    setReports(response.data)
  }

  useEffect(() => {
    const token = localStorage.getItem('officerToken')
    if (!token) return
    loadReports(token).catch(() => {
      localStorage.removeItem('officerToken')
      localStorage.removeItem('officerAuth')
      window.location.assign('/officer-login')
    })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await api.post('/auth/officer-login', formData)
      localStorage.setItem('officerToken', response.data.token)
      localStorage.setItem('officerAuth', 'true')
      await loadReports(response.data.token)
      setIsLoggedIn(true)
    } catch (err) {
      setError(err.response?.status >= 500
        ? 'Database is unavailable. Add your current IP in MongoDB Atlas and restart the server.'
        : err.response?.data?.message || 'Invalid officer credentials')
    }
  }

  const changeReport = (id, field, value) => {
    setReports((items) => items.map((item) => item._id === id ? { ...item, [field]: value } : item))
  }

  const updateReport = async (report) => {
    setSavingId(report._id)
    setError('')
    try {
      const response = await api.patch(`/reports/${report._id}/status`, {
        status: report.status,
        officerNote: report.officerNote || ''
      }, { headers: authHeaders(localStorage.getItem('officerToken')) })
      setReports((items) => items.map((item) => item._id === report._id ? { ...item, ...response.data } : item))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save the report update')
    } finally {
      setSavingId('')
    }
  }

  const analyzeReport = async (report) => {
    setAnalyzingId(report._id)
    setError('')
    try {
      const response = await api.post(`/reports/${report._id}/analyze`, {}, {
        headers: authHeaders(localStorage.getItem('officerToken'))
      })
      setReports((items) => items.map((item) => item._id === report._id ? response.data : item))
    } catch (err) {
      const message = err.response?.data?.message || 'AI analysis failed'
      setError(/quota|rate limit|resource_exhausted|\b429\b/i.test(message)
        ? 'Gemini analysis quota has been reached. Wait for the quota reset or enable billing in Google AI Studio, then try again.'
        : /gemini provider returned|\b503\b|\bunavailable\b|high demand/i.test(message)
        ? 'AI analysis is temporarily busy. Please wait a minute and try again.'
        : message)
    } finally {
      setAnalyzingId('')
    }
  }

  const generateOfficerPdf = async (report) => {
    setGeneratingPdfId(report._id)
    setError('')
    try {
      const response = await api.post(`/reports/${report._id}/officer-report`, {}, {
        headers: authHeaders(localStorage.getItem('officerToken'))
      })
      setReports((items) => items.map((item) => item._id === report._id ? { ...item, ...response.data } : item))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate the farmer PDF report')
    } finally {
      setGeneratingPdfId('')
    }
  }

  const deleteFarmer = async (report) => {
    const farmerId = report.farmer?._id
    if (!farmerId) {
      setError('This report is missing its farmer account ID')
      return
    }
    if (!window.confirm(`Delete ${report.farmer?.name || 'this farmer'} and all submitted reports?`)) return
    setDeletingFarmerId(farmerId)
    setError('')
    try {
      await api.delete(`/reports/farmer/${farmerId}`, { headers: authHeaders(localStorage.getItem('officerToken')) })
      setReports((items) => items.filter((item) => String(item.farmer?._id) !== String(farmerId)))
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete the farmer')
    } finally {
      setDeletingFarmerId('')
    }
  }

  const assetUrl = (asset) => `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'}${asset}`
  const formatReportDate = (date) => date
    ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Date unavailable'

  return (
    <div className="page-container">
      <div className="page-shell">
        <section className={`page-card ${isLoggedIn ? 'officer-page-card' : ''}`}>
          {!isLoggedIn ? <div>
            <p className="page-kicker">Officer dashboard access</p>
            <h1>Review crop-loss reports securely</h1>
            <p>Review evidence, field details, weather context, and AI findings before saving a clear status for the farmer.</p>
          </div> : null}

          {isLoggedIn ? (
            <div className="officer-dashboard">
              <div className="dashboard-header">
                <div>
                  <p className="page-kicker">CropSure · Field operations</p>
                  <h2>Officer dashboard</h2>
                  <p className="helper-text">A clear view of incoming crop-loss reports and the evidence behind each one.</p>
                </div>
                <span className="dashboard-live"><span></span> Review desk</span>
              </div>
              {error ? <p className="status-message">{error}</p> : null}
              <div className="dashboard-metrics">
                <div><strong>{reports.length}</strong><span>Total reports</span></div>
                <div><strong>{reports.filter((report) => report.status === 'submitted').length}</strong><span>Awaiting review</span></div>
                <div><strong>{reports.filter((report) => report.evidenceIntegrity?.riskLevel === 'high').length}</strong><span>Risk flagged</span></div>
              </div>
              <div className="report-queue-heading">
                <div><span className="report-label">Review queue</span><h3>Farmer reports</h3><p>Open a report to review its details and update the decision.</p></div>
                <span className="queue-count">{reports.length} {reports.length === 1 ? 'report' : 'reports'}</span>
              </div>
              <div className="status-list">
                {reports.length === 0 ? <div className="status-item"><span>No reports available yet.</span></div> : reports.map((report) => (
                  <details className="report-review" key={report._id}>
                    <summary className="report-dropdown">
                      <span className="farmer-avatar" aria-hidden="true">{(report.farmer?.name || 'F').trim().charAt(0).toUpperCase()}</span>
                      <span className="report-dropdown-main">
                        <strong>{report.farmer?.name || 'Farmer'}</strong>
                        <span>{formatReportDate(report.createdAt)} <i aria-hidden="true">·</i> {report.cropType || 'Crop not specified'}</span>
                      </span>
                      <span className={`status-pill status-${report.status}`}>{report.status.replaceAll('_', ' ')}</span>
                      <span className="dropdown-chevron" aria-hidden="true"></span>
                    </summary>
                    <div className="report-detail-body">
                    <div className="report-heading">
                      <div><span className="report-label">Crop-loss report</span><strong>{report.farmer?.name || 'Farmer'} - {report.cropType}</strong></div>
                      <span className="report-submitted-date">Submitted {formatReportDate(report.createdAt)}</span>
                    </div>
                    <div className="report-facts"><span><b>{report.damagePercent}%</b> estimated damage</span><span>{report.address || `${report.lat}, ${report.lng}`}</span></div>
                    <div className="report-content-grid">
                      <div className="report-evidence-column">
                        <div className="report-section incident-panel"><span className="report-label">Field note</span><p className="helper-text">{report.description}</p></div>

                        {report.weatherEvidence ? <div className="report-section weather-panel"><span className="report-label">Weather snapshot</span><p className="helper-text">{report.weatherEvidence.temperatureC}°C <b>{report.weatherEvidence.precipitationMm} mm rain</b> <b>{report.weatherEvidence.windSpeedKmh} km/h wind</b></p></div> : null}

                        {report.aiAnalysis ? <div className="ai-analysis">
                          <strong>AI image analysis</strong>
                          <p className="helper-text">{report.aiAnalysis.damageType} - estimated {report.aiAnalysis.estimatedDamagePercent}% damage - {Math.round((report.aiAnalysis.confidence || 0) * 100)}% confidence</p>
                          <p className="helper-text">{report.aiAnalysis.recommendation}</p>
                        </div> : null}

                        {report.evidenceIntegrity ? <div className="ai-analysis">
                          <strong>Evidence integrity: {report.evidenceIntegrity.riskLevel}</strong>
                          <p className="helper-text">Duplicate files found: {report.evidenceIntegrity.duplicateCount}</p>
                          {report.evidenceIntegrity.flags?.map((flag) => <p className="helper-text" key={flag}>{flag}</p>)}
                        </div> : null}

                        <div className="evidence-actions"><button type="button" className="ai-analyze-btn" disabled={analyzingId === report._id || !report.images?.length} onClick={() => analyzeReport(report)}>
                          {analyzingId === report._id ? <><span className="ai-spinner" aria-hidden="true"></span>Analyzing image...</> : report.images?.length ? '✦ Analyze image evidence with AI' : 'Add crop image evidence for AI analysis'}
                        </button>

                          <div className="report-images">{report.images?.map((image) => <a href={assetUrl(image)} target="_blank" rel="noreferrer" key={image}>View image</a>)}{report.documents?.map((document) => <a href={assetUrl(document)} target="_blank" rel="noreferrer" key={document}>View PDF</a>)}</div></div>

                        <div className="location-panel">
                          <div className="location-panel-heading"><span className="report-label">Farmer field location</span><span>{Number(report.lat).toFixed(4)}, {Number(report.lng).toFixed(4)}</span></div>
                          <OfficerLocationGlobe latitude={report.lat} longitude={report.lng} label={report.address || 'Reported field'} />
                        </div>
                      </div>

                      <div className="decision-panel"><span className="report-label">Officer decision</span><select value={report.status} onChange={(event) => changeReport(report._id, 'status', event.target.value)}>
                      {statuses.map((status) => <option value={status} key={status}>{status.replaceAll('_', ' ')}</option>)}
                    </select>
                    <textarea value={report.officerNote || ''} onChange={(event) => changeReport(report._id, 'officerNote', event.target.value)} rows="4" placeholder="Optional note for the farmer" />
                    <button type="button" className="secondary-btn" disabled={savingId === report._id} onClick={() => updateReport(report)}>
                      {savingId === report._id ? 'Saving...' : 'Save update'}
                    </button>
                    <button type="button" className="generate-pdf-btn" disabled={generatingPdfId === report._id} onClick={() => generateOfficerPdf(report)}>
                      {generatingPdfId === report._id ? <><span className="ai-spinner" aria-hidden="true"></span>Generating PDF...</> : report.officerReportPdf ? 'Regenerate & send PDF' : 'Generate & send PDF to farmer'}
                    </button>
                    {report.officerReportPdf ? <p className="pdf-ready-note">PDF is ready for the farmer to download.</p> : null}
                    </div>
                      <button type="button" className="delete-report-btn" disabled={deletingFarmerId === report.farmer?._id} onClick={() => deleteFarmer(report)}>
                        {deletingFarmerId === report.farmer?._id ? 'Deleting user...' : 'Delete user'}
                      </button>
                    </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ) : (
            <form className="form-card" onSubmit={handleSubmit}>
              <h2>Officer Login</h2>
              <label>Officer ID<input name="officerId" value={formData.officerId} onChange={(event) => setFormData({ ...formData, officerId: event.target.value })} required /></label>
              <label>Password<div className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? '◉' : '◌'}</button></div></label>
              {error ? <p className="status-message">{error}</p> : null}
              <button type="submit" className="primary-btn">Enter Dashboard</button>
            </form>
          )}
        </section>

        <div className="page-actions">
          <button type="button" onClick={() => navigate('/')}>Back to Home</button>
          {isLoggedIn ? <button type="button" onClick={() => { localStorage.removeItem('officerToken'); localStorage.removeItem('officerAuth'); setIsLoggedIn(false); setReports([]) }}>Logout</button> : null}
        </div>
      </div>
    </div>
  )
}

export default OfficerLogin
