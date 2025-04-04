import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    include: ['gun']
  },
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
  publicDir: 'public',
  build: {
    rollupOptions: {
      external: ['buffer'],
    },
  },
})
