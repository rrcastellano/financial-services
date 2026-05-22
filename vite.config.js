import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-proxy/twelvedata': {
        target: 'https://api.twelvedata.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy\/twelvedata/, '')
      },
      '/api-proxy/finnhub': {
        target: 'https://finnhub.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy\/finnhub/, '')
      },
      '/api-proxy/brapi': {
        target: 'https://brapi.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy\/brapi/, '')
      }
    }
  }
})

