import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const target = process.env.API_PROXY || 'http://127.0.0.1:4607'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 4517,
    strictPort: true,
    proxy: {
      '/api': { target, changeOrigin: true },
      '/health': { target, changeOrigin: true },
      '/socket.io': { target, ws: true, changeOrigin: true },
    },
  },
})
