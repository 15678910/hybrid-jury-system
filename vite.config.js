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
    chunkSizeWarningLimit: 1000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // .claude/worktrees의 옛 소스 복제본이 테스트로 이중 실행되는 것을 차단
    //
    // 뒤의 둘은 vitest 스위트가 아니라 `node`로 직접 돌리는 독립 스크립트다.
    // 끝에서 process.exit()를 부르는데, vitest는 테스트 파일 안의 process.exit를
    // 오류로 취급한다("process.exit unexpectedly called with 0"). 그래서 113건이
    // 전부 통과해도 스위트 2개가 실패로 잡혔다. CI에는 이 둘을 실행하는
    // 전용 단계가 따로 있으므로(「판례 파서 검증」·「예측 계산 검증」)
    // vitest 수집 대상에서는 뺀다.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.claude/**',
      'functions/**',
      'src/lib/predictionMath.test.mjs',
    ],
  }
})
