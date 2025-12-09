import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dns from 'node:dns'

dns.setDefaultResultOrder('verbatim')

// vite.config.js


export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['react-native-fs', 'fs'], // Add external modules
    },
  },
  optimizeDeps: {
    exclude: ['jsmediatags'], // Exclude from optimization
  },
})
