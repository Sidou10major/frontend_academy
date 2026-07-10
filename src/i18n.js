import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';
import translationAR from './locales/ar/translation.json';

const resources = {
    en: { translation: translationEN },
    fr: { translation: translationFR },
    ar: { translation: translationAR }
};

i18n
    .use(LanguageDetector) // Detects browser language
    .use(initReactI18next) // Passes i18n down to react-i18next
    .init({
        resources,
        fallbackLng: 'en', // Default language
        interpolation: {
            escapeValue: false // React already safes from XSS
        }
    });

// Listen for language changes to update the document direction for Arabic (RTL)
i18n.on('languageChanged', (lng) => {
    document.documentElement.dir = i18n.dir(lng);
    document.documentElement.lang = lng;
});

// Set initial direction on load
document.documentElement.dir = i18n.dir(i18n.language);

export default i18n;