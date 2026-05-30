import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import AsyncStorage from '../utils/asyncStorage'
import { I18nManager, NativeModules, Platform } from 'react-native'

import arTranslation from './locales/ar/translation.json'
import enTranslation from './locales/en/translation.json'

const LANG_KEY = 'masar-lang'

const detectLanguage = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem(LANG_KEY)
    if (stored === 'ar' || stored === 'en') return stored
  } catch {}

  const deviceLang = Platform.OS === 'ios'
    ? NativeModules.SettingsManager?.settings?.AppleLocale?.slice(0, 2)
    : NativeModules.I18nManager?.localeIdentifier?.slice(0, 2)

  return deviceLang === 'en' ? 'en' : 'ar'
}

export const initI18n = async () => {
  const lng = await detectLanguage()

  i18n.use(initReactI18next).init({
    resources: {
      ar: { translation: arTranslation },
      en: { translation: enTranslation },
    },
    lng,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
    returnObjects: true,
  })

  I18nManager.allowRTL(lng === 'ar')
  I18nManager.forceRTL(lng === 'ar')

  i18n.on('languageChanged', (lang) => {
    I18nManager.allowRTL(lang === 'ar')
    I18nManager.forceRTL(lang === 'ar')
    AsyncStorage.setItem(LANG_KEY, lang)
  })

  return i18n
}

export const changeLanguage = async (lang: 'ar' | 'en') => {
  await i18n.changeLanguage(lang)
}

export default i18n
