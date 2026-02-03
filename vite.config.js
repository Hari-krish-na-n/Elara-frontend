import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import dns from 'node:dns'

dns.setDefaultResultOrder('verbatim')

export default defineConfig({
  css: {
    lightningcss: {
      minify: false
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,ico,json,webp}'],
      },
      manifest: {
        name: 'Elara Player',
        short_name: 'Elara',
        description: 'A modern web-based music player with offline support.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  build: {
    rollupOptions: {
      external: ['react-native-fs', 'fs'],
    },
    cssMinify: false
  },
  optimizeDeps: {
    exclude: ['jsmediatags'],
  },
})
