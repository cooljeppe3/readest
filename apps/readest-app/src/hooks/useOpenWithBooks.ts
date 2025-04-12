import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
// Import necessary modules from the Tauri deep-link plugin for handling URL-based file openings.
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
// Import the getCurrentWindow function to interact with the application's window.
import { getCurrentWindow } from '@tauri-apps/api/window';
// Import a utility function to check if the application is running within a Tauri environment.
import { isTauriAppPlatform } from '@/services/environment';
// Import the library store to update application state related to book opening.
import { useLibraryStore } from '@/store/libraryStore';
// Import a navigation utility for programmatically navigating within the application.
import { navigateToLibrary } from '@/utils/nav';

// Define the structure for payload received from 'single-instance' events.
interface SingleInstancePayload {
  args: string[];
  cwd: string;
}

/**
 * useOpenWithBooks is a custom hook that sets up listeners for the application to handle
 * opening files when launched with a file URL (deep link) or when a file is associated
 * with the application on the operating system.
 */
export function useOpenWithBooks() {
  // Get the router instance for programmatically navigating to different pages.
  const router = useRouter();
  // Get the state setter from the library store to update if a file should be opened.
  const { setCheckOpenWithBooks } = useLibraryStore();
  // Use a ref to track whether the open-with-books listeners have already been set up.
  const listenedOpenWithBooks = useRef(false);

  /**
   * handleOpenWithFileUrl: Processes a file URL to extract the file path and
   * notify the application to handle the file.
   * @param url - The URL of the file to handle, which may be a file:// URL or a regular path.
   */
  const handleOpenWithFileUrl = (url: string) => {
    console.log('Handle Open with URL:', url);
    let filePath = url;
    // If the URL is a 'file://' URL, decode and extract the file path.
    if (filePath.startsWith('file://')) {
      filePath = decodeURI(filePath.replace('file://', ''));
    }
    // Ignore URLs that are not file paths (e.g., http, data, blob).
    if (!/^(https?:|data:|blob:)/i.test(filePath)) {
      // Store the file path in a global variable.
      window.OPEN_WITH_FILES = [filePath];
      // Update the library store to indicate that a file should be opened.
      setCheckOpenWithBooks(true);
      // Navigate to the library page with a timestamp to force a reload.
      navigateToLibrary(router, `reload=${Date.now()}`);
    }
  };

  useEffect(() => {
    // Return early if not in a Tauri app or if listeners are already set up.
    if (!isTauriAppPlatform()) return;
    if (listenedOpenWithBooks.current) return;
    listenedOpenWithBooks.current = true;

    const unlistenDeeplink = getCurrentWindow().listen('single-instance', ({ event, payload }) => {
      console.log('Received deep link:', event, payload);
      const { args } = payload as SingleInstancePayload;
      if (args?.[1]) {
        handleOpenWithFileUrl(args[1]);
      }
    });
    const listenOpenWithFiles = async () => {
      // Set up a listener for onOpenUrl events to handle file URLs.
      return await onOpenUrl((urls) => {
        // Process each URL received.
        urls.forEach((url) => {
          handleOpenWithFileUrl(url);
        });
      });
    };
    // Call the listener setup function.
    const unlistenOpenUrl = listenOpenWithFiles();
    // Clean up listeners on unmount.
    return () => {
      // Resolve and call the unlisten function for deep links and file openings.
      unlistenDeeplink.then((f) => f());
      unlistenOpenUrl.then((f) => f());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
