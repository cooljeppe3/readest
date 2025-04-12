'use client';

// Import necessary modules and components.
import clsx from 'clsx';
import * as React from 'react';
import { useEffect, Suspense, useRef } from 'react';

// Import custom hooks and stores.
import { useEnv } from '@/context/EnvContext';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useScreenWakeLock } from '@/hooks/useScreenWakeLock';
import { useSidebarStore } from '@/store/sidebarStore';

// Import components.
import { AboutWindow } from '@/components/AboutWindow';
import { Toast } from '@/components/Toast';
import ReaderContent from './ReaderContent';

// Define the Reader component.
const Reader: React.FC<{ ids?: string }> = ({ ids }) => {
  // Access environment configuration and application service.
  const { envConfig, appService } = useEnv();
  // Access settings and a function to update settings.
  const { settings, setSettings } = useSettingsStore();
  // Access sidebar visibility state.
  const { isSideBarVisible } = useSidebarStore();
  // Access library data and a function to update it.
  const { getVisibleLibrary, setLibrary } = useLibraryStore();
  // Use a ref to track if the component is initializing.
  const isInitiating = useRef(false);

  // Access theme-related functions.
  const { updateAppTheme } = useThemeStore();
  // Apply the current theme.
  useTheme();
  // Enable or disable screen wake lock based on settings.
  useScreenWakeLock(settings.screenWakeLock);

  // Effect to initialize the application.
  useEffect(() => {
    // Set the initial app theme.
    updateAppTheme('base-100');
    if (isInitiating.current) return;
    isInitiating.current = true;
    const initLibrary = async () => {
      const appService = await envConfig.getAppService();
      const settings = await appService.loadSettings();
      setSettings(settings);
      setLibrary(await appService.loadLibraryBooks());
    };

    initLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render the component.
  return (
    // Only render if there are books in the library and global read settings are available.
    getVisibleLibrary().length > 0 &&
    settings.globalReadSettings && (
      <div
        // Apply styling classes conditionally.
        className={clsx(
          `reader-page bg-base-100 text-base-content select-none`,
          // Add rounded-window class if sidebar is not visible and the app has rounded windows.
          !isSideBarVisible && appService?.hasRoundedWindow && 'rounded-window',
        )}
      >
        {/* Use Suspense to handle asynchronous components. */}
        <Suspense>
          <ReaderContent ids={ids} settings={settings} />
          <AboutWindow />
          <Toast />
        </Suspense>
      </div>
    )
  );
};

// Export the Reader component.
export default Reader;
