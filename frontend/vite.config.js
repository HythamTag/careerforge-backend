import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: process.env.VITE_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: process.env.VITE_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
