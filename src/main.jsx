import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

// 홈페이지는 즉시 로드 (사용자가 가장 먼저 보는 페이지)
import App from './App.jsx'

// 나머지 페이지는 필요할 때 로드 (코드 분할)
const Admin = lazy(() => import('./Admin.jsx'))
const HybridChat = lazy(() => import('./pages/HybridChat'))
const FAQTest = lazy(() => import('./pages/FAQTest'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const AdminBlog = lazy(() => import('./pages/AdminBlog'))
const AdminNews = lazy(() => import('./pages/AdminNews'))
const Videos = lazy(() => import('./pages/Videos'))
const AdminVideos = lazy(() => import('./pages/AdminVideos'))
// 카드뉴스 임시 비활성화
// const CardNews = lazy(() => import('./pages/CardNews'))
// const AdminCardNews = lazy(() => import('./pages/AdminCardNews'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const Governance = lazy(() => import('./pages/Governance'))
const GovernanceAdmin = lazy(() => import('./pages/GovernanceAdmin'))
const Donate = lazy(() => import('./pages/Donate'))
const EuropeJurySystem = lazy(() => import('./pages/EuropeJurySystem'))
const JudiciaryNews = lazy(() => import('./pages/JudiciaryNews'))
const SentencingAnalysis = lazy(() => import('./pages/SentencingAnalysis'))
const ReformAnalysis = lazy(() => import('./pages/ReformAnalysis'))
const LawDatabase = lazy(() => import('./pages/LawDatabase'))
const JudgeEvaluation = lazy(() => import('./pages/JudgeEvaluation'))
const JudgeDetail = lazy(() => import('./pages/JudgeDetail'))
const JudicialNetwork = lazy(() => import('./pages/JudicialNetwork'))
const LegalSearch = lazy(() => import('./pages/LegalSearch'))
const FloatingChat = lazy(() => import('./CozeFloatingChat'))

// 로딩 컴포넌트
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">페이지를 불러오는 중...</p>
        </div>
    </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/blog/admin" element={<AdminBlog />} />
          <Route path="/videos/admin" element={<AdminVideos />} />
          <Route path="/chat" element={<HybridChat />} />
          <Route path="/faq-test" element={<FAQTest />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/videos" element={<Videos />} />
          {/* 카드뉴스 임시 비활성화 */}
          {/* <Route path="/cardnews" element={<CardNews />} /> */}
          {/* <Route path="/cardnews/admin" element={<AdminCardNews />} /> */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/governance/admin" element={<GovernanceAdmin />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/news" element={<JudiciaryNews />} />
          <Route path="/news/admin" element={<AdminNews />} />
          <Route path="/sentencing-analysis" element={<SentencingAnalysis />} />
          <Route path="/europe-jury" element={<EuropeJurySystem />} />
          <Route path="/reform-analysis" element={<ReformAnalysis />} />
          <Route path="/law-database" element={<LawDatabase />} />
          <Route path="/judge-evaluation" element={<JudgeEvaluation />} />
          <Route path="/judge/:name" element={<JudgeDetail />} />
          <Route path="/judicial-network" element={<JudicialNetwork />} />
          <Route path="/legal-search" element={<LegalSearch />} />
        </Routes>
        {/* 모든 페이지에서 보이는 플로팅 챗봇 */}
        <FloatingChat />
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)
