import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

const englishReplies = {
  welcome: 'Hello! I can help you report crop damage, choose a field location, upload evidence, or track your report.',
  report: 'To report crop damage, choose Report Crop Damage, enter the crop, estimated damage, description, and search for the damaged field location before submitting.',
  location: 'Type your village, district, or full address and select Find location. The map will move there and place the field pin automatically.',
  evidence: 'Upload clear JPG, PNG, WebP photos, or PDF documents of the crop damage. You can add up to seven files.',
  track: 'Choose Track Report Status, sign in with your registered email and password, then view your report status, officer note, and update dates.',
  login: 'Use your registered email and password on Farmer Login. If you are new, choose Create an account first.',
  fallback: 'I can help with reporting damage, field location, photo evidence, farmer login, or tracking an officer update. Please try one of these topics.'
}

const hindiReplies = {
  welcome: 'नमस्ते! मैं फसल नुकसान रिपोर्ट, खेत की जगह, प्रमाण अपलोड और रिपोर्ट की स्थिति में आपकी सहायता कर सकती हूँ।',
  report: 'फसल नुकसान की रिपोर्ट करने के लिए फसल नुकसान रिपोर्ट करें विकल्प खोलें। फसल का नाम, नुकसान प्रतिशत, विवरण और प्रभावित खेत की जगह भरकर रिपोर्ट जमा करें।',
  location: 'अपने गाँव, ज़िले या पूरे पते को लिखकर जगह खोजें दबाएँ। मानचित्र उस जगह पर जाएगा और पिन अपने-आप लग जाएगा।',
  evidence: 'फसल नुकसान की साफ़ तस्वीरें या दस्तावेज़ अपलोड करें। आप अधिकतम सात फ़ाइलें जोड़ सकते हैं।',
  track: 'रिपोर्ट की स्थिति देखें चुनें और पंजीकृत ईमेल व पासवर्ड से लॉगिन करें। इसके बाद स्थिति, अधिकारी का नोट और अपडेट की तारीख देख सकते हैं।',
  login: 'किसान लॉगिन में अपना पंजीकृत ईमेल और पासवर्ड डालें। नए किसान पहले खाता बनाएँ।',
  fallback: 'मैं रिपोर्ट, खेत की जगह, तस्वीरें या दस्तावेज़, लॉगिन और अधिकारी के अपडेट के बारे में सहायता कर सकती हूँ। कृपया इनमें से कोई विषय बोलें या लिखें।'
}

function replyFor(question, language) {
  const lowerQuestion = question.toLowerCase()
  const isHindi = language === 'hi' || /[\u0900-\u097F]/.test(question)
  const replies = isHindi ? hindiReplies : englishReplies

  if (/location|map|field|gaon|गाँव|गाव|location|लोकेशन|मैप|map/.test(lowerQuestion)) return replies.location
  if (/photo|image|document|pdf|evidence|proof|फोटो|तस्वीर|दस्तावेज|सबूत/.test(lowerQuestion)) return replies.evidence
  if (/track|status|officer|update|claim|स्थिति|स्टेटस|अधिकारी|अपडेट/.test(lowerQuestion)) return replies.track
  if (/login|password|email|sign in|लॉगिन|पासवर्ड|ईमेल/.test(lowerQuestion)) return replies.login
  if (/report|damage|crop|loss|nuksan|fasal|रिपोर्ट|नुकसान|फसल/.test(lowerQuestion)) return replies.report
  return replies.fallback
}

function FarmerVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage } = useLanguage()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef(null)

  useEffect(() => () => {
    recognitionRef.current?.abort()
    window.speechSynthesis?.cancel()
  }, [])

  const speak = (text, lang = language) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    window.speechSynthesis.speak(utterance)
  }

  const answerQuestion = (value) => {
    const response = replyFor(value, language)
    setAnswer(response)
    speak(response, /[\u0900-\u097F]/.test(value) ? 'hi' : language)
  }

  const submitQuestion = (event) => {
    event.preventDefault()
    if (!question.trim()) return
    answerQuestion(question.trim())
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }
    recognitionRef.current?.abort()
    const recognition = new SpeechRecognition()
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event) => {
      const spokenQuestion = event.results[0][0].transcript
      setQuestion(spokenQuestion)
      answerQuestion(spokenQuestion)
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  const greeting = language === 'hi' ? hindiReplies.welcome : englishReplies.welcome

  return <aside className="voice-assistant" aria-label="Farmer voice assistant">
    {isOpen ? <div className="voice-assistant-panel">
      <div className="voice-assistant-heading">
        <div><span>{language === 'hi' ? 'किसान सहायता' : 'Farmer help'}</span><strong>🌾 {language === 'hi' ? 'वॉइस सहायक' : 'Voice Assistant'}</strong></div>
        <button type="button" onClick={() => setIsOpen(false)} aria-label="Close voice assistant">×</button>
      </div>
      <div className="voice-language-switch" aria-label="Choose assistant language">
        <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>English</button>
        <button type="button" className={language === 'hi' ? 'active' : ''} onClick={() => setLanguage('hi')}>हिंदी</button>
      </div>
      <p className="voice-greeting">{answer || greeting}</p>
      <form onSubmit={submitQuestion} className="voice-question-form">
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={language === 'hi' ? 'अपना सवाल लिखें' : 'Type your question'} />
        <button type="submit">{language === 'hi' ? 'पूछें' : 'Ask'}</button>
      </form>
      <button type="button" className="voice-mic-button" onClick={startListening} disabled={isListening}>
        {isListening ? (language === 'hi' ? 'सुन रही हूँ…' : 'Listening…') : (language === 'hi' ? '🎙️ बोलकर पूछें' : '🎙️ Ask by voice')}
      </button>
      {!speechSupported ? <p className="voice-help-text">{language === 'hi' ? 'इस ब्राउज़र में आवाज़ से सवाल पूछने की सुविधा उपलब्ध नहीं है। अपना सवाल लिखें।' : 'Voice input is unavailable in this browser. Please type your question.'}</p> : null}
      <p className="voice-help-text">{language === 'hi' ? 'पूछें: रिपोर्ट कैसे करें, खेत की जगह कैसे जोड़ें, तस्वीरें कैसे भेजें, या स्थिति कैसे देखें?' : 'Try: How do I report damage? How do I add location? How do I upload photos?'} </p>
    </div> : null}
    <button type="button" className="voice-assistant-launcher" onClick={() => setIsOpen(true)} aria-label="Open farmer voice assistant">🎙️ <span>{language === 'hi' ? 'किसान सहायता' : 'Farmer Help'}</span></button>
  </aside>
}

export default FarmerVoiceAssistant
