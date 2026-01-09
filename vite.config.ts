import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        short_name: 'Easy Enclosure',
        name: 'Easy Enclosure',
        icons: [
          { src: 'favicon.ico', sizes: '64x64 32x32 24x24 16x16', type: 'image/x-icon' },
          { src: 'logo192.png', type: 'image/png', sizes: '192x192' },
          { src: 'logo512.png', type: 'image/png', sizes: '512x512' }
        ],
        start_url: '.',
        display: 'standalone',
        theme_color: '#000000',
        background_color: '#ffffff'
      }
    })
  ],
  base: '/easy-enclosure/',  // GitHub Pages subdirectory
  build: {
    outDir: 'build',  // Keep same as CRA for gh-pages compatibility
    rollupOptions: {
      output: {
        manualChunks: {
          'jscad-core': ['@jscad/modeling', '@jscad/regl-renderer'],
          'react-vendor': ['react', 'react-dom'],
          'hookstate': ['@hookstate/core']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@jscad/modeling', '@jscad/regl-renderer', '@jscad/stl-serializer', '@hookstate/core']
  },
  server: { port: 3000, open: true }
})
