import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawDomain = env.VITE_API_DOMAIN || 'localhost:1000'
  const protocol = env.VITE_API_PROTOCOL || 'http'
  // Nếu .env ghi full URL (https://...) thì dùng luôn; không thì ghép protocol + domain
  const target =
    rawDomain.startsWith('http://') || rawDomain.startsWith('https://')
      ? rawDomain
      : `${protocol}://${rawDomain}`
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
