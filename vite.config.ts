import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    include: ['react-router-dom', 'gun', '@cosmjs/cosmwasm-stargate'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['buffer'],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'cosmos-vendor': ['@cosmjs/cosmwasm-stargate', '@cosmjs/proto-signing'],
          'gun-vendor': ['gun', 'gun/sea.js', 'gun/axe.js'],
        },
      },
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    open: true,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      overlay: true,
      clientPort: 5174,
    },
    proxy: {
      '/graphql': {
        target: 'https://constellations-api.mainnet.stargaze-apis.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/graphql/, '/graphql'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization';
          });
        },
      },
      '/api/collections/holders': {
        target: 'https://constellations-api.mainnet.stargaze-apis.com/api/v1/collections',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/collections\/holders/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            proxyRes.headers['access-control-allow-origin'] = '*';
          });
        },
      },
      '/api/staking/delegations': {
        target: 'https://rpc.stargaze-apis.com/cosmos/staking/v1beta1/delegations',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/staking\/delegations/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            proxyRes.headers['access-control-allow-origin'] = '*';
          });
        },
      },
      '/graphql-fallback': {
        target: 'https://constellations-api.testnet.stargaze-apis.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/graphql-fallback/, '/graphql'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            // Add CORS headers for preflight requests
            if (req.method === 'OPTIONS') {
              proxyReq.setHeader('Access-Control-Allow-Origin', '*');
              proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
              proxyReq.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
              proxyReq.setHeader('Access-Control-Max-Age', '86400');
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            // Add CORS headers to the response
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization';
          });
        },
      },
    },
  },
  base: '/',
  publicDir: 'public'
})
