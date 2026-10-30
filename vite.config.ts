import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'


const crossOriginIsolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: crossOriginIsolation,
    proxy: { '/api': 'http://localhost:3000' }
  },
  preview: { headers: crossOriginIsolation }
})
