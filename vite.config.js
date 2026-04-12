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
          if (!id.includes('node_modules')) return
          // Firebase (큰 라이브러리, lazy load 대상)
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase'
          }
          // 차트 라이브러리 (lazy load 대상)
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'vendor-charts'
          }
          // 에디터 (lazy load 대상)
          if (id.includes('node_modules/react-quill') || id.includes('node_modules/quill')) {
            return 'vendor-editor'
          }
          // AI/ML (매우 큰 라이브러리)
          if (id.includes('node_modules/@xenova') || id.includes('node_modules/onnxruntime')) {
            return 'vendor-ai'
          }
          // 나머지 모든 node_modules는 하나의 vendor로 통합 (React 포함)
          return 'vendor'
        }
      }
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  }
})
