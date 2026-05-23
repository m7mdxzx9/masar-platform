import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import translationAR from '../public/locales/ar/translation.json'
import translationEN from '../public/locales/en/translation.json'

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('masar-lang') : null

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: translationAR },
      en: { translation: translationEN },
    },
    lng: savedLang || 'ar',
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'masar-lang',
    },
  })

function setDocumentDirection(lng: string) {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lng
}

setDocumentDirection(i18n.language || savedLang || 'ar')

i18n.on('languageChanged', (lng) => {
  setDocumentDirection(lng)
  localStorage.setItem('masar-lang', lng)
})

export default i18n
