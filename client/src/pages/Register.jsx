import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useLanguage } from '../context/LanguageContext'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { language, t } = useLanguage()
  const hi = language === 'hi'

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleRegister = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const payload = { ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim() }
      const res = await api.post('/auth/register', payload)
      const { token, farmer } = res.data
      localStorage.setItem('farmerToken', token)
      localStorage.setItem('farmerName', farmer.name)
      localStorage.setItem('farmerEmail', farmer.email)
      localStorage.setItem('farmerAuth', 'true')
      navigate('/report-damage')
    } catch (err) {
      setError(err.response?.data?.message || (err.request
        ? `Cannot reach the API at ${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}. Start the server and refresh this page.`
        : 'Registration failed. Please check your details and try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-shell">
        <section className="page-card">
          <div>
            <p className="page-kicker">{hi ? 'खाता बनाएँ' : 'Create account'}</p>
            <h1>{hi ? 'किसान के रूप में पंजीकरण करें' : 'Register as a Farmer'}</h1>
            <div className="registration-copy">
              <p>
                {hi ? 'हम आपकी मेहनत की फसल की सुरक्षा और नुकसान रिपोर्ट करना आसान बनाने के लिए यहाँ हैं। खेत की जानकारी, प्रमाण और नुकसान का विवरण भेजने के लिए अपना किसान खाता बनाएँ। 🌱📷🤝' : 'We are here to help you protect your hard work and make crop-loss reporting simpler. Create your farmer account to share your field details, upload clear evidence, describe the damage, and follow every update from the review team in one trusted place. 🌱📷🤝'}
              </p>
              <p>
                {hi ? 'खाता बनने के बाद आप कुछ आसान चरणों में पूरी रिपोर्ट जमा कर सकते हैं।' : 'Once your account is ready, you can submit a complete report in just a few steps and receive support whenever you need it.'}
              </p>
            </div>
          </div>

          <form className="form-card" onSubmit={handleRegister}>
            <h2>{hi ? 'किसान पंजीकरण' : 'Farmer Registration'}</h2>
            <label>
              {t('fullName')}
              <input name="name" value={form.name} onChange={handleChange} type="text" placeholder="Your full name" autoComplete="name" required />
            </label>
            <label>
              {t('email')}
              <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@example.com" autoComplete="email" required />
            </label>
            <label>
              {t('phone')}
              <input name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="10-digit phone" autoComplete="tel" />
            </label>
            <label>
              {t('password')}
              <div className="password-field">
                <input name="password" value={form.password} onChange={handleChange} type={showPassword ? 'text' : 'password'} placeholder="Choose a strong password" autoComplete="new-password" required />
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
            </label>
            {error ? <p className="status-message">{error}</p> : null}
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? (hi ? 'खाता बनाया जा रहा है…' : 'Creating account…') : t('createAccount')}
            </button>
          </form>
        </section>

        <div className="page-actions">
          <button type="button" onClick={() => navigate('/')}>
            {t('backHome')}
          </button>
          <button type="button" onClick={() => navigate('/login')}>
            {hi ? 'पहले से खाता है? लॉगिन करें' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Register 
