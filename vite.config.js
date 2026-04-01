/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/kakao-token': {
        target: 'https://kauth.kakao.com',
        changeOrigin: true,
        rewrite: (path) => '/oauth/token',
      }
    }
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase into its own chunk (includes all @firebase/* scoped packages)
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase'
          }
          // React core into its own chunk
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react'
          }
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router'
          }
          // Recharts (large charting library)
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) {
            return 'vendor-charts'
          }
          // Force graph (very large) — both react wrappers and underlying libs
          if (id.includes('node_modules/react-force-graph') || id.includes('node_modules/force-graph') || id.includes('node_modules/3d-force-graph') || id.includes('node_modules/three') || id.includes('node_modules/ngraph') || id.includes('node_modules/kapsule') || id.includes('node_modules/d3-force') || id.includes('node_modules/aframe')) {
            return 'vendor-graph'
          }
          // PDF libraries
          if (id.includes('node_modules/pdfjs-dist') || id.includes('node_modules/pdf-parse')) {
            return 'vendor-pdf'
          }
          // Transformers / AI (very large) — isolated so it never blocks initial load
          if (id.includes('node_modules/@xenova/transformers') || id.includes('node_modules/@huggingface') || id.includes('node_modules/onnxruntime-web') || id.includes('node_modules/onnxruntime-node')) {
            return 'vendor-ai'
          }
          // Google AI
          if (id.includes('node_modules/@google/generative-ai')) {
            return 'vendor-google-ai'
          }
          // React Quill editor
          if (id.includes('node_modules/react-quill') || id.includes('node_modules/quill')) {
            return 'vendor-editor'
          }
          // QR code
          if (id.includes('node_modules/qrcode')) {
            return 'vendor-qrcode'
          }
          // DOMPurify — sanitization library, isolate to avoid bloating misc
          if (id.includes('node_modules/dompurify')) {
            return 'vendor-dompurify'
          }
          // React Helmet (both react-helmet and react-helmet-async)
          if (id.includes('node_modules/react-helmet')) {
            return 'vendor-helmet'
          }
          // Zustand state management
          if (id.includes('node_modules/zustand')) {
            return 'vendor-zustand'
          }
          // Redux ecosystem (@reduxjs/toolkit, redux, immer)
          if (id.includes('node_modules/@reduxjs/toolkit') || id.includes('node_modules/redux') || id.includes('node_modules/immer')) {
            return 'vendor-redux'
          }
          // Lodash utility library
          if (id.includes('node_modules/lodash')) {
            return 'vendor-lodash'
          }
          // Other large node_modules
          if (id.includes('node_modules')) {
            return 'vendor-misc'
          }
        }
      }
    },
    // Increase chunk size warning limit slightly since we're splitting
    chunkSizeWarningLimit: 500,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  }
})
