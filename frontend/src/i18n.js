import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'

const STORAGE_KEY = 'detectoma_lang'

export const supportedLangs = ['en', 'ar']

export function getInitialLang() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && supportedLangs.includes(saved)) return saved
  return null // null => first visit, show language chooser
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: getInitialLang() || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

// Keep <html> lang/dir in sync so the WHOLE layout mirrors for Arabic (RTL), not just text.
export function applyLanguage(lang) {
  i18n.changeLanguage(lang)
  localStorage.setItem(STORAGE_KEY, lang)
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

// Apply on load if a language is already chosen.
const initial = getInitialLang()
if (initial) applyLanguage(initial)

export default i18n
