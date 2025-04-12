import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { applyCustomTheme } from '@/styles/themes'; // Import function to apply custom themes

/**
 * useTheme - Custom hook to manage and apply the application's theme.
 * It handles both custom themes and the basic dark/light mode switching.
 */
export const useTheme = () => {
  const { settings } = useSettingsStore(); // Access settings from the settings store
  const { themeColor, isDarkMode } = useThemeStore(); // Access theme color and dark mode status from the theme store

  /**
   * useEffect to apply custom themes defined in the settings.
   * Runs whenever the settings change.
   */
  useEffect(() => {
    const customThemes = settings.globalReadSettings?.customThemes ?? []; // Get custom themes from settings, default to empty array
    // Iterate over each custom theme and apply it to the document
    customThemes.forEach((customTheme) => {
      applyCustomTheme(customTheme);
    });
  }, [settings]); // Dependency array: rerun when settings change

  /**
   * useEffect to switch between dark and light mode and apply the selected theme color.
   * Runs whenever the theme color or dark mode status changes.
   */
  useEffect(() => {
    const colorScheme = isDarkMode ? 'dark' : 'light'; // Determine if color scheme should be 'dark' or 'light'
    // Set the theme attribute on the root element to control the applied CSS
    document.documentElement.setAttribute('data-theme', `${themeColor}-${colorScheme}`);
    // Set the color-scheme property on the root element for browser-level color scheme adjustments
    document.documentElement.style.setProperty('color-scheme', colorScheme);
  }, [themeColor, isDarkMode]); // Dependency array: rerun when themeColor or isDarkMode changes
};
