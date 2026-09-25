import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'

function Landing() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const openReportForm = () => {
    const isFarmerSignedIn = Boolean(localStorage.getItem('farmerToken'))
    navigate(isFarmerSignedIn ? '/report-damage' : '/register')
  }

  return ( 
    <div className="portal">
      <div className="utility-bar">
        <span>{t('farmerPortal')}</span>
        <div>
          <><span>{t('helpline')}</span><LanguageSelector compact /></>
        </div>
      </div>

      <header className="portal-header">
        <div className="brand">
          <div className="logo-mark">CS</div>
          <div>
            <strong>CropSure AI</strong>
            <small>{t('brandSubtitle')}</small>
          </div>
        </div>

        <nav>
          <a href="#home">{t('home')}</a>
          <a href="#services">{t('howItWorks')}</a>
          <a href="#services">{t('services')}</a>
          <a href="/login" className="login-button">{t('farmerLogin')}</a>
          <a href="/officer-login" className="login-button">{t('officerAccess')}</a>
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">{t('heroEyebrow')}</p>

            <h1>
              {t('heroTitle')}
              <span>{t('heroTitleAccent')}</span>
            </h1>

            <p className="hero-text">
              {t('heroText')}
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="report-button"
                onClick={openReportForm}
              >
                {t('reportDamage')} <span>→</span>
              </button>

              <button
                type="button"
                className="outline-button"
                onClick={() => navigate('/login', { state: { from: '/track-status' } })}
              >
                {t('trackReport')}
              </button>

              <button
                type="button"
                className="outline-button"
                onClick={() => navigate('/login')}
              >
                {t('farmerLogin')}
              </button>

              <button
                type="button"
                className="outline-button"
                onClick={() => navigate('/officer-login')}
              >
                {t('officerAccess')}
              </button>
            </div>

            <div className="hero-badges">
              <span>{t('languageHint')}</span>
            </div>

            <div className="quick-stats">
              <div>
                <strong>📍</strong>
                <span>
                  {t('quick1')}
                </span>
              </div>

              <div>
                <strong>📷</strong>
                <span>
                  {t('quick2')}
                </span>
              </div>

              <div>
                <strong>📄</strong>
                <span>
                  {t('quick3')}
                </span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="field-card">
              <span className="field-icon">🌾</span>
              <p>{t('reportDamage')}</p>
              <strong>{t('evidenceReady')}</strong>

              <div className="progress">
                <span></span>
              </div>
            </div>

            <div className="map-card">📍 {t('fieldVerified')}</div>
          </div>
        </section>

        <section className="services" id="services">
          <div className="section-heading">
            <p>{t('servicesLabel')}</p>
            <h2>{t('serviceTitle')}</h2>
            <span>{t('serviceIntro')}</span>
          </div>

          <div className="service-grid">
            <article>
              <div className="service-card-top"><span className="service-icon" aria-hidden="true">⌖</span><span className="service-number">01 / 03</span></div>
              <h3>{t('service1Title')}</h3>
              <p>{t('service1Text')}</p>
              <ul><li>{t('service1Feature1')}</li><li>{t('service1Feature2')}</li></ul>
            </article>

            <article>
              <div className="service-card-top"><span className="service-icon" aria-hidden="true">▧</span><span className="service-number">02 / 03</span></div>
              <h3>{t('service2Title')}</h3>
              <p>{t('service2Text')}</p>
              <ul><li>{t('service2Feature1')}</li><li>{t('service2Feature2')}</li></ul>
            </article>

            <article>
              <div className="service-card-top"><span className="service-icon" aria-hidden="true">↗</span><span className="service-number">03 / 03</span></div>
              <h3>{t('service3Title')}</h3>
              <p>{t('service3Text')}</p>
              <ul><li>{t('service3Feature1')}</li><li>{t('service3Feature2')}</li></ul>
            </article>
          </div>
          <div className="services-cta"><span>{t('servicesCtaText')}</span><button type="button" onClick={openReportForm}>{t('reportDamage')} <span aria-hidden="true">→</span></button></div>
        </section>
      </main>

      <footer>
        <span>{t('footer')}</span>
        <span>{t('privacy')}</span>
      </footer>
    </div>
  )
}

export default Landing;
