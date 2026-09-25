import './App.css'
import { Routes, Route, useLocation } from 'react-router-dom'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import OfficerLogin from './pages/OfficerLogin'
import ReportDamage from './pages/ReportDamage'
import TrackStatus from './pages/TrackStatus'
import FarmerVoiceAssistant from './components/FarmerVoiceAssistant'
import LanguageSelector from './components/LanguageSelector'

function App() {
  const location = useLocation()
  const isOfficerArea = location.pathname === '/officer-login'

  return <>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/officer-login" element={<OfficerLogin />} />
      <Route path="/report-damage" element={<ReportDamage />} />
      <Route path="/track-status" element={<TrackStatus />} />
    </Routes>
    {!isOfficerArea ? <>{location.pathname !== '/' ? <div className="global-language-control"><LanguageSelector compact /></div> : null}<FarmerVoiceAssistant /></> : null}
  </>
}

export default App
