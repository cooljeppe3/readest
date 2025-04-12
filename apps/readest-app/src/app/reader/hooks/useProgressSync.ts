import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSync } from '@/hooks/useSync';
import { BookConfig } from '@/types/book';
import { useBookDataStore } from '@/store/bookDataStore';
import { useReaderStore } from '@/store/readerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { serializeConfig } from '@/utils/serializer';
import { CFI } from '@/libs/document';
import { eventDispatcher } from '@/utils/event';
import { DEFAULT_BOOK_SEARCH_CONFIG, SYNC_PROGRESS_INTERVAL_SEC } from '@/services/constants';

export const useProgressSync = (bookKey: string) => {
  // Hook for accessing translations.
  const _ = useTranslation();
  // Hook to manage the book's configuration data.
  const { getConfig, setConfig } = useBookDataStore();
  // Hook to access the reader's current view and reading progress.
  const { getView, getProgress } = useReaderStore();
  // Hook for accessing application settings.
  const { settings } = useSettingsStore();
  // Hook for synchronizing book configurations with a remote source.
  const { syncedConfigs, syncConfigs } = useSync(bookKey);
  // Hook to get the current user's information.
  const { user } = useAuth();
  // Get the current view for the specified book.
  const view = getView(bookKey);
  // Get the current configuration for the specified book.
  const config = getConfig(bookKey);
  // Get the current progress for the specified book.
  const progress = getProgress(bookKey);
  // Flag to prevent accidental synchronization without pulling the config first.
  const configSynced = useRef(false);
  // Flag to track if the configuration has been pulled for the first time.
  const firstPulled = useRef(false);

  /**
   * Pushes the book's configuration to the server.
   * @param bookKey - The key of the book.
   * @param config - The book's configuration data.
   */
  const pushConfig = (bookKey: string, config: BookConfig | null) => {
    // Exit if there's no config or no user.
    if (!config || !user) return;
    // Extract the book's hash from the book key.
    const bookHash = bookKey.split('-')[0]!;
    // Add the book hash to the configuration.
    const newConfig = { bookHash, ...config };
    // Serialize and compress the configuration data.
    const compressedConfig = JSON.parse(
      serializeConfig(newConfig, settings.globalViewSettings, DEFAULT_BOOK_SEARCH_CONFIG),
    );
    // Remove booknotes from the compressed configuration before syncing.
    delete compressedConfig.booknotes;
    // Initiate the synchronization process with the compressed configuration.
    syncConfigs([compressedConfig], bookHash, 'push');
  };
  /**
   * Pulls the book's configuration from the server.
   * @param bookKey - The key of the book.
   */
  const pullConfig = (bookKey: string) => {
    // Exit if there's no user.
    if (!user) return;
    // Extract the book's hash from the book key.
    const bookHash = bookKey.split('-')[0]!;
    // Initiate the synchronization process to pull the configuration.
    syncConfigs([], bookHash, 'pull');
  };
  // sync config if first synced pull config, then push
  const syncConfig = () => {
    if (!configSynced.current) {
      pullConfig(bookKey);
    } else {
      if (config && config.progress && config.progress[0] > 0) {
        pushConfig(bookKey, config);
      }
    }
  };
  /**
   * Handles the 'sync-book-progress' custom event.
   * @param event - The custom event containing the book key.
   */
  const handleSyncBookProgress = (event: CustomEvent) => {
    // Extract the book key from the event details.
    const { bookKey: syncBookKey } = event.detail;
    // If the event's book key matches the current book key, synchronize the configuration.
    if (syncBookKey === bookKey) {
      syncConfig();
    }
  };

  useEffect(() => {
    eventDispatcher.on('sync-book-progress', handleSyncBookProgress);
    return () => {
      eventDispatcher.off('sync-book-progress', handleSyncBookProgress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookKey]);

  useEffect(() => {
    // If progress is not available or if this is not the first pull, exit the effect.
    if (!progress || firstPulled.current) return;
    // Set the first pull flag to true.
    firstPulled.current = true;
    // Pull the configuration from the server.
    pullConfig(bookKey);
    // Clean up function: ensure config is synced when unmounted
    return () => {
      syncConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const lastProgressSyncTime = useRef<number>(0);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!config?.location || !user) return;
    // Get the current time.
    const now = Date.now();
    // Calculate the time since the last synchronization.
    const timeSinceLastSync = now - lastProgressSyncTime.current;
    // If the time since the last sync is greater than the defined interval, sync immediately.
    // otherwise set a timeout for syncing
    if (timeSinceLastSync > SYNC_PROGRESS_INTERVAL_SEC * 1000) {
      lastProgressSyncTime.current = now;
      syncConfig();
    } else {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(
        () => {
          lastProgressSyncTime.current = Date.now();
          syncTimeoutRef.current = null;
          syncConfig();
        },
        SYNC_PROGRESS_INTERVAL_SEC * 1000 - timeSinceLastSync,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // sync progress once when the book is opened
  useEffect(() => {
    if (!configSynced.current && syncedConfigs) {
      configSynced.current = true;
      const syncedConfig = syncedConfigs.filter((c) => c.bookHash === bookKey.split('-')[0])[0];
      if (syncedConfig) {
        const configCFI = config?.location;
        const syncedCFI = syncedConfig.location;
        setConfig(bookKey, syncedConfig);
        if (syncedCFI && configCFI) {
          if (CFI.compare(configCFI, syncedCFI) < 0) {
            if (view) {
              view.goTo(syncedCFI);
              eventDispatcher.dispatch('hint', {
                bookKey,
                message: _('Reading Progress Synced'),
              });
            }
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedConfigs]);
};
