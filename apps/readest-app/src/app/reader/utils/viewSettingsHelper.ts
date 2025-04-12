import { ViewSettings } from '@/types/book';
import { EnvConfigType } from '@/services/environment';
import { useBookDataStore } from '@/store/bookDataStore';
import { useReaderStore } from '@/store/readerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getStyles } from '@/utils/style';

/**
 * saveViewSettings - Saves view settings for a specific book or globally.
 *
 * @param {EnvConfigType} envConfig - The environment configuration object.
 * @param {string} bookKey - The key identifying the book for which to save the settings.
 * @param {K} key - The specific setting key to save (e.g., 'fontSize', 'lineHeight').
 * @param {ViewSettings[K]} value - The new value for the setting.
 * @param {boolean} [skipGlobal=false] - If true, skips saving the setting globally.
 * @param {boolean} [applyStyles=true] - If true, applies the new styles immediately.
 *
 * This function is responsible for updating the view settings for a given book,
 * either locally for that book or globally for all books. It also handles
 * the immediate application of new styles and the persistence of settings.
 */
export const saveViewSettings = async <K extends keyof ViewSettings>(
  envConfig: EnvConfigType,
  bookKey: string,
  key: K,
  value: ViewSettings[K],
  skipGlobal = false, // Flag to skip saving settings globally
  applyStyles = true, // Flag to apply styles immediately
) => {
  // Retrieve current state from zustand stores
  const { settings, isFontLayoutSettingsGlobal, setSettings, saveSettings } =
    useSettingsStore.getState();
  const { getView, getViewSettings, setViewSettings } = useReaderStore.getState();
  const { getConfig, saveConfig } = useBookDataStore.getState();

  // Get view settings for the specific book
  const viewSettings = getViewSettings(bookKey)!;
  // Get the configuration for the book
  const config = getConfig(bookKey)!;
  // Check if the current value is different from the new value
  if (viewSettings[key] !== value) {
    // Update the view settings with the new value
    viewSettings[key] = value;
    // If applyStyles is true, update the styles on the current view
    if (applyStyles) {
      const view = getView(bookKey);
      // Apply new styles
      view?.renderer.setStyles?.(getStyles(viewSettings));
    }
  }
  // Save updated view settings to the reader store
  setViewSettings(bookKey, viewSettings);
  // If settings are set to be global and we're not skipping global updates
  if (isFontLayoutSettingsGlobal && !skipGlobal) {
    settings.globalViewSettings[key] = value;
    // Update the settings in the settings store
    setSettings(settings);
  }
  // Save the updated configuration and settings
  await saveConfig(envConfig, bookKey, config, settings);
  await saveSettings(envConfig, settings);
};
