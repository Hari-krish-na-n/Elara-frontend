import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dns from 'node:dns'

dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  css: {
    // Option 1: Disable lightningcss minify
    lightningcss: {
      minify: false
    },
    
    // Option 2: Or try using PostCSS instead (uncomment if above doesn't work)
    // transformer: 'postcss'
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['react-native-fs', 'fs'], // Add external modules
    },
    // You can also try this:
    cssMinify: false // Disable CSS minification during build
  },
  optimizeDeps: {
    exclude: ['jsmediatags'], // Exclude from optimization
  },
})