import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeContext'
import App from './App'
import './i18n'
import './styles/index.css'

const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined
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