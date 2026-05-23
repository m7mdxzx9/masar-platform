import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
// @ts-ignore - Node.js built-in
import path from 'path';
// @ts-ignore - Node.js built-in
import { fileURLToPath } from 'url';
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
export default defineConfig({
    base: './',
    plugins: [react(), tailwindcss(), VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico'],
            manifest: {
                name: 'مسار - Masar',
                short_name: 'مسار',
                description: 'منصة تعلم ذكية مع رفيق AI',
                theme_color: '#0F172A',
                background_color: '#0F172A',
                display: 'standalone',
                orientation: 'portrait',
                dir: 'rtl',
                lang: 'ar',
                icons: [
                    { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    { urlPattern: /^https?:\/\/.*\/api\/.*/i, handler: 'NetworkFirst', options: { cacheName: 'api-cache' } },
                ],
            },
        })],
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
                rewrite: function (path) { return path.replace(/^\/openrouter/, ''); }
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
});
