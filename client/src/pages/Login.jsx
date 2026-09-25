import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import api from '../api'
import { useLanguage } from '../context/LanguageContext'

function Login() { 
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [authed, setAuthed] = useState(() => localStorage.getItem('farmerAuth') === 'true')
  const { language, t } = useLanguage()
  const hi = language === 'hi'

  const handleSignIn = async () => {
    const errs = {}
    const normalizedEmail = email.trim().toLowerCase()
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(normalizedEmail)) errs.email = 'Enter a valid email address.'
    if (!password) errs.password = 'Enter your password.'

    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setMessage('Please fix the highlighted fields.')
      return
    }

    try {
      const res = await api.post('/auth/login', { email: normalizedEmail, password })
      const { token, farmer } = res.data
      localStorage.setItem('farmerToken', token)
      localStorage.setItem('farmerName', farmer.name || email)
      localStorage.setItem('farmerEmail', farmer.email || email)
      localStorage.setItem('farmerAuth', 'true')
      const dest = (location.state && location.state.from) || '/'
      navigate(dest)
    } catch (err) {
      setMessage(err.response?.status >= 500
        ? 'Database is unavailable. Add your current IP in MongoDB Atlas and restart the server.'
        : err.response?.data?.message === 'Invalid credentials'
          ? 'Email or password is incorrect. If this farmer was deleted by an officer, create a new farmer account.'
          : err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="page-container">
      <div className="page-shell">
        <section className="page-card">
          <div>
            <p className="page-kicker">{hi ? 'किसान प्रवेश' : 'Farmer access'}</p>
            <h1>{hi ? 'CropSure AI में आपका स्वागत है' : 'Welcome back to CropSure AI'}</h1>
            <p>
              {hi ? 'अपनी पुरानी रिपोर्ट देखें, नए प्रमाण जोड़ें और अपनी रिपोर्ट की प्रगति जानें।' : 'Sign in to review your previous reports, add fresh evidence, and follow your claim progress without switching between multiple channels.'}
            </p>
            <div className="info-grid">
              <article>
                <h3>{hi ? 'सहेजी गई रिपोर्ट' : 'Saved reports'}</h3>
                <p>{hi ? 'अपने द्वारा जमा की गई सभी खेत रिपोर्ट देखें और किसी भी ड्राफ्ट को फिर से खोलें।' : 'See all field reports you have submitted and reopen any draft.'}</p>
              </article>
              <article>
                <h3>{hi ? 'प्रमाण अपडेट' : 'Evidence updates'}</h3>
                <p>{hi ? 'समीक्षा टीम के अधिक जानकारी माँगने पर नई तस्वीरें या टिप्पणियाँ अपलोड करें।' : 'Upload new photos or comments whenever the review team requests more detail.'}</p>
              </article>
              <article>
                <h3>{hi ? 'दावा मार्गदर्शन' : 'Claim guidance'}</h3>
                <p>{hi ? 'तेज़ स्वीकृति के लिए अगले चरण और आवश्यक दस्तावेज़ों की स्पष्ट जानकारी पाएँ।' : 'Receive clear next steps and document requirements for faster approvals.'}</p>
              </article>
            </div>
          </div>

          <div className="form-card">
            <h2>{t('farmerLogin')}</h2>
            <label>
              {t('email')}
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
              {errors.email ? <small style={{color: 'crimson'}}>{errors.email}</small> : null}
            </label>
            <label>
              {t('password')}
              <div className="password-field">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '◉' : '◌'}
                </button>
              </div>
              {errors.password ? <small style={{color: 'crimson'}}>{errors.password}</small> : null}
            </label>
            {message ? <p className="status-message">{message}</p> : null}
            <button
              type="button"
              className="primary-btn"
              onClick={handleSignIn}
            >
              {t('farmerLogin')}
            </button>
            <p className="helper-text">{hi ? 'अपनी रिपोर्ट और खेत की जानकारी देखने के लिए लॉगिन करें।' : 'Sign in to access your reports and register fields.'}</p>
            <Link className="secondary-btn login-create-account" to="/register">
              {hi ? 'नए किसान? खाता बनाएँ' : 'New farmer? Create an account'}
            </Link>
          </div>
        </section>

        <div className="page-actions">
          <button type="button" onClick={() => navigate('/')}>
            {t('backHome')}
          </button>
          <button type="button" onClick={() => navigate('/track-status')}>
            {hi ? 'अपनी रिपोर्ट देखें' : 'Track Existing Report'}
          </button>

          {authed ? (
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('farmerAuth')
                localStorage.removeItem('farmerToken')
                localStorage.removeItem('farmerName')
                localStorage.removeItem('farmerEmail')
                setAuthed(false)
                navigate('/')
              }}
            >
              Logout
            </button>
          ) : null}

        </div>
      </div>
    </div>
  )
}

export default Login
