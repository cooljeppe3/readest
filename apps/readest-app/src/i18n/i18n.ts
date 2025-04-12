// Import the i18next library for internationalization.
import i18n from 'i18next';
// Import the react-i18next module to integrate i18next with React.
import { initReactI18next } from 'react-i18next';
// Import the HttpApi backend to load translations from HTTP endpoints.
import HttpApi from 'i18next-http-backend';
// Import the LanguageDetector to automatically detect the user's language.
import LanguageDetector from 'i18next-browser-languagedetector';
// Import the options from the i18next-scanner configuration.
import { options } from '../../i18next-scanner.config';

// Configure i18next
i18n
  // Use the HttpApi backend to load translations.
  .use(HttpApi)
  // Use the LanguageDetector to detect the user's language.
  .use(LanguageDetector)
  // Use the initReactI18next module to integrate with React.
  .use(initReactI18next)
  // Initialize i18next with the following options.
  .init({
    // Define the list of supported languages.
    supportedLngs: ['en', ...options.lngs],
    // Define the fallback languages for specific cases.
    fallbackLng: {
      // If the language is 'zh-HK', fallback to 'zh-TW' then 'en'.
      'zh-HK': ['zh-TW', 'en'],
      // For these languages, fallback to 'ru' then 'en'.
      kk: ['ru', 'en'],
      ky: ['ru', 'en'],
      tk: ['ru', 'en'],
      uz: ['ru', 'en'],
      ug: ['ru', 'en'],
      tt: ['ru', 'en'],
      // Default fallback to 'en'.
      default: ['en'],
    },
    // Define the namespaces used in the project.
    ns: options.ns,
    // Set the default namespace.
    defaultNS: options.defaultNs,
    // Configure the backend to load translations from HTTP.
    backend: {
      // Define the path where translation files are located.
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Configure language detection.
    detection: {
      // Define the order in which language detection methods are applied.
      order: ['querystring', 'localStorage', 'navigator'],
      // Cache the detected language in localStorage.
      caches: ['localStorage'],
    },
    // Disable key separator to prevent issues with nested keys.
    keySeparator: false,
    // Disable namespace separator.
    nsSeparator: false,
    // Configure interpolation.
    interpolation: {
      // Disable escaping of values to allow HTML rendering in translations.
      escapeValue: false,
    },
    // Configure react-i18next behavior.
    react: {
      // Disable Suspense to prevent unnecessary loading states.
      useSuspense: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  console.log('Language changed to', lng);
});
// Export the configured i18next instance.
export default i18n;
