import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Admin from './Admin.jsx'
import HybridChat from './pages/HybridChat'
import FAQTest from './pages/FAQTest'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import BlogWrite from './pages/BlogWrite'
import AdminBlog from './pages/AdminBlog'
import Videos from './pages/Videos'
import AdminVideos from './pages/AdminVideos'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/blog" element={<AdminBlog />} />
        <Route path="/admin/videos" element={<AdminVideos />} />
        <Route path="/chat" element={<HybridChat />} />
        <Route path="/faq-test" element={<FAQTest />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/write" element={<BlogWrite />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/videos" element={<Videos />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)