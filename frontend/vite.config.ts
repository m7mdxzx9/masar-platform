import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @ts-ignore - Node.js built-in
import path from 'path'
// @ts-ignore - Node.js built-in
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@/': path.resolve(__dirname, 'src') + '/'
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/openrouter': {
        target: 'https://openrouter.ai/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openrouter/, '')
      }
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'codemirror': ['@codemirror/state', '@codemirror/view'],
          'pyodide': ['pyodide'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@codemirror/state', '@codemirror/view', '@codemirror/commands', '@codemirror/lang-python', '@codemirror/autocomplete', '@codemirror/theme-one-dark', '@codemirror/language'],
    exclude: ['pyodide']
  },
  worker: {
    format: 'es'
  }
})
