import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: [
      'favicon.svg',
      'pwa-icon.svg',
      'pwa-192.png',
      'pwa-512.png',
      'pwa-maskable-512.png',
      'apple-touch-icon.png',
    ],
    manifest: {
      name: 'Japan Expense Tracker',
      short_name: 'Japan Expenses',
      description: 'Offline-first JPY travel spending tracker for Japan trips.',
      theme_color: '#b94132',
      background_color: '#fbf7f2',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      navigateFallback: '/index.html',
    },
  }), cloudflare()],
})