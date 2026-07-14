import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import './styles.css'
import App from './App'
import { applyThemeToDom } from './store/theme'

// Apply theme before first paint to avoid a flash of the wrong theme (FOUC).
;(function initTheme() {
  const saved = localStorage.getItem('detectoma_theme')
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  applyThemeToDom(saved === 'light' || saved === 'dark' ? saved : prefersDark ? 'dark' : 'light')
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
