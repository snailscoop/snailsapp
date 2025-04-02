import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    open: true,
    proxy: {
      '/graphql': {
        target: 'https://constellations.zone/graphql',
        changeOrigin: true,
        secure: false,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    }
  },
  base: '/',
  publicDir: 'public'
})
