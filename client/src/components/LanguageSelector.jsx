import { useLanguage } from '../context/LanguageContext'

function LanguageSelector({ compact = false }) {
  const { language, setLanguage, t } = useLanguage()
  return <div className={`language-selector ${compact ? 'compact' : ''}`}>
    {!compact ? <span>{t('selectLanguage')}</span> : null}
    <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>{t('english')}</button>
    <button type="button" className={language === 'hi' ? 'active' : ''} onClick={() => setLanguage('hi')}>{t('hindi')}</button>
  </div>
}

export default LanguageSelector
