'use client';

import { useEffect } from 'react'; // Import useEffect for side effects in functional components
import { hasUpdater } from '@/services/environment'; // Import the function to check for the presence of an updater
import { checkForAppUpdates } from '@/helpers/updater'; // Import the function to check for application updates
import { useTranslation } from '@/hooks/useTranslation'; // Import the hook for internationalization (i18n)
import { useOpenWithBooks } from '@/hooks/useOpenWithBooks'; // Import the hook to handle opening books
import { useSettingsStore } from '@/store/settingsStore'; // Import the store for managing user settings
import Reader from './components/Reader'; // Import the main Reader component

/**
 * Page component for the Reader view.
 * This component is responsible for rendering the Reader component and managing update checks.
 */
export default function Page() {
  const _ = useTranslation(); // Initialize the translation hook for localized strings
  const { settings } = useSettingsStore(); // Get the user settings from the settings store

  useOpenWithBooks(); // Use the hook to handle opening books, likely from external sources

  /**
   * useEffect hook to perform side effects.
   * This effect checks for app updates when the component mounts or when the settings change.
   */
  useEffect(() => {
    // Define an asynchronous function to check for app updates
    const doCheckAppUpdates = async () => {
      // Check if the updater is available and if automatic update checks are enabled
      if (hasUpdater() && settings.autoCheckUpdates) {
        // Perform the app update check using the translation function
        await checkForAppUpdates(_);
      }
    };
    doCheckAppUpdates(); // Call the update check function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]); // Run this effect when the settings change

  return <Reader />; // Render the main Reader component
}
}
