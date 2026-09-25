import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api, { authHeaders } from '../api'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import { useLanguage } from '../context/LanguageContext'

const MAP_INITIAL_CENTER = { lat: 22.9734, lng: 78.6569 }

function LocationSelector({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng)
    }
  })
  return null
}

function MapCenter({ position, shouldRecenter }) {
  const map = useMap()

  useEffect(() => {
    if (shouldRecenter) map.setView(position, 16)
  }, [map, position, shouldRecenter])

  return null
}

function ReportDamage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { language, t } = useLanguage()
  const hi = language === 'hi'

  useEffect(() => {
    const authed = localStorage.getItem('farmerAuth') === 'true'
    if (!authed) {
      navigate('/login', { state: { from: location.pathname } })
    }
  }, [location.pathname, navigate])
  const [formData, setFormData] = useState({
    crop: '',
    damagePercent: '',
    description: '',
    locationLabel: 'No field location selected yet',
    lat: null,
    lng: null,
  })
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const fileRef = useRef()
  const [address, setAddress] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const { lat, lng } = formData

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLocationSearch = async (event) => {
    event.preventDefault()
    if (!locationQuery.trim()) {
      setFeedback('Enter the village, district, or field location first.')
      return
    }

    setIsSearchingLocation(true)
    try {
      const params = new URLSearchParams({
        q: locationQuery.trim(),
        format: 'jsonv2',
        limit: '1',
        countrycodes: 'in',
      })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
      const results = await response.json()
      const result = results[0]
      if (!result) {
        setFeedback('Location not found. Try adding the village and district name.')
        return
      }

      const nextLat = Number(result.lat)
      const nextLng = Number(result.lon)
      setFormData((prev) => ({
        ...prev,
        lat: nextLat,
        lng: nextLng,
        locationLabel: result.display_name,
      }))
      setAddress(result.display_name)
      setFeedback('Location found. The map has moved to this location and the field pin was placed automatically.')
    } catch {
      setFeedback('Unable to search this location right now. You can select it directly on the map.')
    } finally {
      setIsSearchingLocation(false)
    }
  }

  // reverse geocode when lat/lng changes
  useEffect(() => {
    if (!lat || !lng) return
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.display_name) {
          setAddress(data.display_name)
          setFormData((p) => ({ ...p, locationLabel: data.display_name }))
        }
      })
      .catch(() => {})
  }, [lat, lng])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!hasSelectedLocation) {
      setFeedback('Select the exact damaged field on the map before submitting the report.')
      return
    }
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('farmerToken')
      const fd = new FormData()
      fd.append('cropType', formData.crop)
      fd.append('damagePercent', formData.damagePercent)
      fd.append('description', formData.description)
      fd.append('lat', formData.lat)
      fd.append('lng', formData.lng)
      fd.append('address', address || formData.locationLabel)
      const files = fileRef.current?.files || []
      for (let i = 0; i < files.length; i++) fd.append('evidence', files[i])

      await api.post('/reports', fd, {
        headers: { ...authHeaders(token), 'Content-Type': 'multipart/form-data' }
      })
      setFeedback('Report submitted successfully. Officer can review it shortly.')
      // Every new report must receive a fresh field selection. Do not reuse a
      // previous damaged-field pin for the next report from this farmer.
      setFormData({
        crop: '',
        damagePercent: '',
        description: '',
        locationLabel: 'No field location selected yet',
        lat: null,
        lng: null,
      })
      setAddress('')
      setLocationQuery('')
      if (fileRef.current) fileRef.current.value = null
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasSelectedLocation = formData.lat !== null && formData.lng !== null
    && Number.isFinite(Number(formData.lat)) && Number.isFinite(Number(formData.lng))
  const position = hasSelectedLocation ? [formData.lat, formData.lng] : [MAP_INITIAL_CENTER.lat, MAP_INITIAL_CENTER.lng]

  return (
    <div className="page-container report-page-container">
      <div className="page-shell">
        <section className="page-card report-card report-card-simple">
          <header className="report-simple-heading">
            <p className="page-kicker">{hi ? 'किसान सहायता' : 'Farmer support'}</p>
            <h1>{hi ? 'फसल नुकसान रिपोर्ट' : 'Report Crop Damage'}</h1>
            <p>{hi ? 'फसल, नुकसान और खेत की जगह का विवरण भरें।' : 'Add a few details about the crop, damage, and affected field.'}</p>
          </header>
          <form className="form-card report-form report-form-simple" onSubmit={handleSubmit}>
            <div className="report-input-grid">
            <label>
              {t('cropAffected')}
              <input name="crop" value={formData.crop} onChange={handleChange} type="text" placeholder="Wheat / Rice / Cotton" required />
            </label>
            <label>
              {t('damagePercent')}
              <div className="damage-input-wrap"><input name="damagePercent" value={formData.damagePercent} onChange={handleChange} type="number" min="0" max="100" placeholder="e.g. 35" required /><span>%</span></div>
            </label>
            <label className="report-wide-field">
              {t('incidentDescription')}
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Describe what happened, when it started, and how the damage appeared." required></textarea>
            </label>
            </div>

            <div className="location-search report-form-section">
              <div className="report-section-heading"><div><h3>{t('damageLocation')}</h3><p>{hi ? 'पता खोजें या मानचित्र पर प्रभावित खेत चुनें।' : 'Search for an address or select the affected field on the map.'}</p></div></div>
              <div className="map-action-row">
                <input
                  id="damage-location"
                  value={locationQuery}
                  onChange={(event) => setLocationQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleLocationSearch(event)
                    }
                  }}
                  placeholder={hi ? 'गाँव, जिला या खेत की जगह' : 'Village, district, or field location'}
                />
                <button type="button" className="secondary-btn" disabled={isSearchingLocation} onClick={handleLocationSearch}>
                  {isSearchingLocation ? t('searching') : t('findLocation')}
                </button>
              </div>
              <p className="helper-text location-help">{hi ? 'मानचित्र पर टैप करके खेत की सही जगह चुनें।' : 'Click the map to place the pin on the affected field.'}</p>
            </div>

            <div className={`report-map-frame ${hasSelectedLocation ? 'location-selected' : ''}`}>
              <div className="report-map-topline"><span>{hasSelectedLocation ? '●' : '○'} {hasSelectedLocation ? (hi ? 'खेत की जगह चुनी गई' : 'Field location selected') : (hi ? 'मानचित्र पर जगह चुनें' : 'Choose a point on the map')}</span><small>{hasSelectedLocation ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : (hi ? 'भारत का मानचित्र' : 'India map')}</small></div>
              <MapContainer key={hasSelectedLocation ? `${lat}-${lng}` : 'india'} center={position} zoom={hasSelectedLocation ? 13 : 5} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapCenter position={position} shouldRecenter={hasSelectedLocation} />
                <LocationSelector onSelect={({ lat, lng }) => {
                  setFormData((prev) => ({ ...prev, lat, lng, locationLabel: `${lat.toFixed(6)}, ${lng.toFixed(6)}` }))
                  setFeedback('Field pin updated.')
                }} />
                {hasSelectedLocation ? <Marker position={position} /> : null}
              </MapContainer>
            </div>
            {hasSelectedLocation ? <p className="report-selected-address">{address || formData.locationLabel}</p> : null}

            <div className="report-form-section report-upload-section">
              <div className="report-section-heading"><div><h3>{hi ? 'तस्वीरें या दस्तावेज़ जोड़ें' : 'Photos or documents (optional)'}</h3><p>{hi ? 'नुकसान की साफ तस्वीरें या सहायक दस्तावेज़ जोड़ें।' : 'Add clear damage photos or supporting documents if available.'}</p></div></div>
              <label className="evidence-dropzone">
                <span className="upload-symbol" aria-hidden="true">↑</span>
                <strong>{hi ? 'फ़ाइलें चुनने के लिए क्लिक करें' : 'Choose files to upload'}</strong>
                <small>{hi ? 'JPG, PNG, WebP या PDF · अधिकतम 7 फ़ाइलें' : 'JPG, PNG, WebP, or PDF · up to 7 files'}</small>
                <input type="file" ref={fileRef} multiple accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf" />
              </label>
            </div>

            {feedback ? <p role="status" className={`status-message ${feedback.startsWith('Report submitted successfully') ? 'success-message' : ''}`}>{feedback}</p> : null}

            <button type="submit" className="primary-btn report-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (hi ? 'रिपोर्ट जमा हो रही है...' : 'Submitting report...') : t('submitReport')} {!isSubmitting ? <span aria-hidden="true">→</span> : null}
            </button>
          </form>
        </section>

        <div className="page-actions">
          <button type="button" onClick={() => navigate('/')}>
            {t('backHome')}
          </button>
          <button type="button" onClick={() => navigate('/register')}>
            {hi ? 'अपना खेत पंजीकृत करें' : 'Register Your Field'}
          </button>

        </div>
      </div>
    </div>
  )
}

export default ReportDamage;
