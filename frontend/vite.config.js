import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api to the FastAPI backend during dev so the frontend can use same-origin calls.
// Backend port is configurable: set VITE_API_TARGET (e.g. http://localhost:8010) if 8000 is taken.
const apiTarget = process.env.VITE_API_TARGET || 'http://127.0.0.1:8000'

export default defineConfig({
  // Served from https://<user>.github.io/detecta/ on GitHub Pages.
  base: '/detecta/',
  plugins: [react()],
  server: {
    host: true,        // listen on 0.0.0.0 so phones / other devices on the LAN can reach it
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
