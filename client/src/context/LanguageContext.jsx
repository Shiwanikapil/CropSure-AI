import { createContext, useContext, useEffect, useState } from 'react'

const translations = {
  en: {
    selectLanguage: 'Select language', english: 'English', hindi: 'हिंदी',
    farmerPortal: 'Farmer Support Portal', farmerLogin: 'Farmer Login', officerAccess: 'Access Officer',
    reportDamage: 'Report Crop Damage', trackReport: 'Track Report Status',
    home: 'Home', howItWorks: 'How It Works', services: 'Services',
    heroEyebrow: 'AI-ASSISTED FARMER SUPPORT PLATFORM', heroTitle: 'Report Crop Damage', heroTitleAccent: ' with Clear Evidence.',
    heroText: 'Submit field location, crop details, damage photos and incident information in one structured report for transparent review.',
    languageHint: 'Choose your language. You can change it anytime.',
    createAccount: 'Create Account', backHome: 'Back to Home', submitReport: 'Submit Report',
    findLocation: 'Find location', searching: 'Searching...', cropAffected: 'Crop affected', damagePercent: 'Estimated damage percentage',
    incidentDescription: 'Incident description', damageLocation: 'Where did the crop damage happen?', uploadEvidence: 'Upload evidence',
    reportTracking: 'Report tracking', currentSummary: 'Current Report Summary', addAnother: 'Add Another Report',
    email: 'Email', password: 'Password', fullName: 'Full name', phone: 'Phone', signIn: 'Sign in',
    helpline: 'Helpline: 1800-XXX-XXXX', fieldVerified: 'Field Location Verified', evidenceReady: 'Evidence Ready',
    serviceTitle: 'Support from field report to follow-up', servicesLabel: 'How CropSure helps',
    serviceIntro: 'A guided way to document crop damage, review supporting evidence, and keep track of the next steps.',
    service1Title: 'Create a field report', service1Text: 'Record where the damage happened and give reviewers the context they need.',
    service1Feature1: 'Pin the affected field on the map', service1Feature2: 'Add crop, damage estimate, and incident notes',
    service2Title: 'Attach clear evidence', service2Text: 'Keep photos and supporting documents together with the report they explain.',
    service2Feature1: 'Upload field photos and PDF documents', service2Feature2: 'Review weather context and optional AI image insights',
    service3Title: 'Follow the review', service3Text: 'See the report status and the officer’s updates in one place.',
    service3Feature1: 'Track progress after submission', service3Feature2: 'Get the officer’s decision report when it is ready',
    servicesCtaText: 'Ready to document a crop-loss incident?',
    footer: '© 2026 CropSure AI — Academic Project Prototype', privacy: 'Privacy Policy · Help & Support',
    quick1: 'Location-based evidence', quick2: 'Photo & document upload', quick3: 'Claim-ready report',
    brandSubtitle: 'Crop Loss Evidence & Claim Assistant',
  },
  hi: {
    selectLanguage: 'भाषा चुनें', english: 'English', hindi: 'हिंदी',
    farmerPortal: 'किसान सहायता पोर्टल', farmerLogin: 'किसान लॉगिन', officerAccess: 'अधिकारी लॉगिन',
    reportDamage: 'फसल नुकसान रिपोर्ट करें', trackReport: 'रिपोर्ट की स्थिति देखें',
    home: 'होम', howItWorks: 'यह कैसे काम करता है', services: 'सेवाएँ',
    heroEyebrow: 'एआई-सहायित किसान सहायता मंच', heroTitle: 'फसल नुकसान रिपोर्ट करें', heroTitleAccent: ' स्पष्ट प्रमाण के साथ।',
    heroText: 'खेत की जगह, फसल की जानकारी, नुकसान की फोटो और घटना का विवरण एक रिपोर्ट में जमा करें।',
    languageHint: 'अपनी भाषा चुनें। आप इसे कभी भी बदल सकते हैं।',
    createAccount: 'खाता बनाएँ', backHome: 'होम पर जाएँ', submitReport: 'रिपोर्ट जमा करें',
    findLocation: 'जगह खोजें', searching: 'खोज रहे हैं...', cropAffected: 'प्रभावित फसल', damagePercent: 'अनुमानित नुकसान प्रतिशत',
    incidentDescription: 'घटना का विवरण', damageLocation: 'फसल का नुकसान कहाँ हुआ?', uploadEvidence: 'प्रमाण अपलोड करें',
    reportTracking: 'रिपोर्ट ट्रैकिंग', currentSummary: 'वर्तमान रिपोर्ट सारांश', addAnother: 'एक और रिपोर्ट जोड़ें',
    email: 'ईमेल', password: 'पासवर्ड', fullName: 'पूरा नाम', phone: 'फ़ोन', signIn: 'लॉगिन करें',
    helpline: 'सहायता नंबर: 1800-XXX-XXXX', fieldVerified: 'खेत की जगह सत्यापित', evidenceReady: 'प्रमाण तैयार',
    serviceTitle: 'खेत की रिपोर्ट से आगे की जानकारी तक सहायता', servicesLabel: 'CropSure आपकी कैसे मदद करता है',
    serviceIntro: 'फसल के नुकसान का विवरण दें, प्रमाण की समीक्षा करें और आगे की प्रक्रिया की स्थिति जानें।',
    service1Title: 'खेत की रिपोर्ट बनाएँ', service1Text: 'नुकसान की जगह दर्ज करें और समीक्षा के लिए ज़रूरी जानकारी जोड़ें।',
    service1Feature1: 'मानचित्र पर प्रभावित खेत चुनें', service1Feature2: 'फसल, नुकसान का अनुमान और घटना का विवरण जोड़ें',
    service2Title: 'प्रमाण जोड़ें', service2Text: 'तस्वीरें और सहायक दस्तावेज़ उसी रिपोर्ट के साथ रखें।',
    service2Feature1: 'खेत की तस्वीरें और PDF दस्तावेज़ अपलोड करें', service2Feature2: 'मौसम की जानकारी और वैकल्पिक AI तस्वीर विश्लेषण देखें',
    service3Title: 'समीक्षा की स्थिति जानें', service3Text: 'रिपोर्ट की स्थिति और अधिकारी के अपडेट एक जगह देखें।',
    service3Feature1: 'जमा करने के बाद प्रगति देखें', service3Feature2: 'तैयार होने पर अधिकारी की निर्णय रिपोर्ट पाएँ',
    servicesCtaText: 'फसल नुकसान की घटना दर्ज करने के लिए तैयार हैं?',
    footer: '© 2026 क्रॉपश्योर एआई — शैक्षणिक परियोजना प्रारूप', privacy: 'गोपनीयता नीति · सहायता और सहयोग',
    quick1: 'जगह आधारित प्रमाण', quick2: 'तस्वीर और दस्तावेज़ अपलोड', quick3: 'दावा-तैयार रिपोर्ट',
    brandSubtitle: 'फसल नुकसान प्रमाण और दावा सहायक',
  }
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('appLanguage') || 'en')

  useEffect(() => {
    localStorage.setItem('appLanguage', language)
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en'
  }, [language])

  const t = (key) => translations[language][key] || translations.en[key] || key
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
