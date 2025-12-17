import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Admin from './Admin.jsx'
import HybridChat from './pages/HybridChat'
import FAQTest from './pages/FAQTest'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/chat" element={<HybridChat />} />
        <Route path="/faq-test" element={<FAQTest />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)