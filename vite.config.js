import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-proxy/td': {
        target: 'https://api.twelvedata.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-proxy\/td/, '')
      },
      '/api-proxy/fh': {
        target: 'https://finnhub.io',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-proxy\/fh/, '')
      },
      '/api-proxy/br': {
        target: 'https://brapi.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-proxy\/br/, '')
      },
      '/api-proxy/gm': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-proxy\/gm/, '')
      },
      '/api-proxy/sb': {
        target: 'https://hdcwkoketvqbxzdlpcaw.supabase.co',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-proxy\/sb/, '')
      }
    }
  }
})

