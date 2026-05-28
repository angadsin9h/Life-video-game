import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'LifeQuest – Life as a Video Game',
        short_name: 'LifeQuest',
        description: 'Track every dimension of your life. Sleep, energy, mindset, purpose, body, social — all in one gamified platform.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#7c3aed',
        orientation: 'portrait-primary',
        categories: ['health', 'lifestyle', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          { name: 'Command Center', url: '/command-center', description: 'Your mission control' },
          { name: 'Morning Powerup', url: '/morning-powerup', description: 'Start your day strong' },
          { name: 'Nightly Debrief', url: '/nightly-debrief', description: 'Close your day' },
          { name: 'Life Score', url: '/life-score-engine', description: 'Check your life score' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
