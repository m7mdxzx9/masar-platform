import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeContext'
import App from './App'
import './i18n'
import './styles/index.css'

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
const Router = isElectron ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Router>
  </React.StrictMode>,
)