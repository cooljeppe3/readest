import '@/i18n/i18n';
import { useTranslation as _useTranslation } from 'react-i18next';

// Define a type for the translation function.
// This function will be used to translate keys to their respective localized strings.
export type TranslationFunc = (key: string, options?: Record<string, number | string>) => string;

/**
 * Custom hook for handling translations using react-i18next.
 * It provides a simplified interface for translating strings,
 * automatically setting the default value to the translation key if not found.
 *
 * @param {string} namespace - The namespace for translations (default: 'translation').
 * @returns {TranslationFunc} A translation function that takes a key and optional parameters.
 */
export const useTranslation = (namespace: string = 'translation') => {
  // use react-i18next's useTranslation hook with the specified namespace
  const { t } = _useTranslation(namespace);

  // Return a custom translation function.
  // This function extends the original 't' function.
  // Setting the defaultValue to the key itself in case the key is not found in translations.
  return (key: string, options = {}) => t(key, { defaultValue: key, ...options });
};
