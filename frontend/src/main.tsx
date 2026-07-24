import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeContext'
import ErrorBoundary from './components/layout/ErrorBoundary'
import App from './App'
import './i18n'
import './styles/index.css'
import { startAutoSyncEngine } from './services/autoSync'

if (typeof window !== 'undefined') {
  startAutoSyncEngine()
  
  // Force purge old PWA ServiceWorker cache and old dummy data from mobile browser
  if (!localStorage.getItem('masar_purge_v5')) {
    localStorage.removeItem('masar-subjects-storage')
    localStorage.removeItem('masar-notes-storage')
    localStorage.removeItem('masar-goals-storage')
    localStorage.removeItem('masar-subject-order')
    localStorage.setItem('masar_purge_v5', 'true')
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name))
      })
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const errorMsg = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
    console.error("Renderer crash captured:", errorMsg);
    if ((window as any).electronAPI?.logError) {
      (window as any).electronAPI.logError(errorMsg);
    }
  });
  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = `Unhandled Rejection: ${event.reason}`;
    console.error("Unhandled promise rejection captured:", errorMsg);
    if ((window as any).electronAPI?.logError) {
      (window as any).electronAPI.logError(errorMsg);
    }
  });
}

const isElectron = typeof window !== 'undefined' && (
  (window as any).electronAPI !== undefined ||
  window.location.protocol === 'file:' ||
  /electron/i.test(navigator.userAgent)
)

const isGitHubPages = typeof window !== 'undefined' && (
  window.location.hostname.endsWith('github.io') ||
  window.location.pathname.startsWith('/masar-platform') ||
  (import.meta as any).env?.VITE_USE_HASH_ROUTER === 'true'
)

const Router = (isElectron || isGitHubPages) ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </Router>
  </React.StrictMode>,
)