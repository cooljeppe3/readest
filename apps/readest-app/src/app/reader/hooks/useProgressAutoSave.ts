import { useCallback, useEffect } from 'react';
import { useEnv } from '@/context/EnvContext';
import { useBookDataStore } from '@/store/bookDataStore';
import { useReaderStore } from '@/store/readerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { throttle } from '@/utils/throttle';
/**
 * Custom hook to automatically save the reading progress and book configuration.
 * @param bookKey - Unique identifier for the book.
 */
export const useProgressAutoSave = (bookKey: string) => {
  // Access environment configurations.
  const { envConfig } = useEnv();
  // Access functions to manage book configuration data.
  const { getConfig, saveConfig } = useBookDataStore();
  // Access functions to manage the reader's state, such as progress.
  const { getProgress } = useReaderStore();
  // Retrieve the current reading progress for the given book.
  const progress = getProgress(bookKey);

  /**
   * Save the book's current configuration, including reading progress.
   * This function is throttled to prevent it from being called too frequently.
   */
  const saveBookConfig = useCallback(
    throttle(async () => {
      // Retrieve the current book configuration.
      const config = getConfig(bookKey)!;
      // Retrieve the current application settings.
      const settings = useSettingsStore.getState().settings;
      // Save the book's configuration to persistent storage.
      await saveConfig(envConfig, bookKey, config, settings);
      // Throttle the saving process to once every 10 seconds (10000 ms).
    }, 10000),
    // The dependencies array is empty because we only want to create this function once.
    [],
  );

  /**
   * React effect to trigger `saveBookConfig` when the reading progress or `bookKey` changes.
   */
  useEffect(() => {
    saveBookConfig();
    // The effect will re-run if the progress or bookKey changes.
  }, [progress, bookKey]);
};
//No changes were made to the file
