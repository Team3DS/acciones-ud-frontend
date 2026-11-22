import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'API_PROXY_')
  const proxy = { '/api/v1': { target: env.API_PROXY_TARGET || 'http://127.0.0.1:8080', changeOrigin: true, ws: true } }
  return {
    plugins: [react()],
    base: './',
    server: { host: '127.0.0.1', proxy },
    preview: { proxy },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
