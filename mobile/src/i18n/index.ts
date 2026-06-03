import * as Localization from 'expo-localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en'
import az from './az'
import ru from './ru'

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en'
const supportedLang = ['en', 'az', 'ru'].includes(deviceLang) ? deviceLang : 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    az: { translation: az },
    ru: { translation: ru },
  },
  lng: supportedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
