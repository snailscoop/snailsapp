import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['gun']
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
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
    },
    watch: {
      usePolling: true,
      interval: 1000
    },
    hmr: {
      overlay: true,
      clientPort: 5174
    }
  },
  base: '/',
  publicDir: 'public'
})
