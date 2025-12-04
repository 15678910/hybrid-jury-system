import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, readdirSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-public-files',
      closeBundle() {
        const publicDir = 'public'
        const outDir = 'dist'
        
        if (existsSync(publicDir)) {
          const files = readdirSync(publicDir)
          files.forEach(file => {
            const srcPath = join(publicDir, file)
            const destPath = join(outDir, file)
            try {
              copyFileSync(srcPath, destPath)
              console.log(`✓ Copied ${file} to dist`)
            } catch (err) {
              console.error(`✗ Failed to copy ${file}:`, err)
            }
          })
        }
      }
    }
  ],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
