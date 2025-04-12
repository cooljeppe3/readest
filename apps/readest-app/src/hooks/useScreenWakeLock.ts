import { useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriAppPlatform, isWebAppPlatform } from '@/services/environment';
/**
 * Custom hook to manage the screen wake lock, preventing the screen from dimming or locking.
 * It supports both web and Tauri app platforms and handles visibility/focus changes.
 *
 * @param {boolean} lock - A boolean to enable/disable the screen wake lock.
 */
export const useScreenWakeLock = (lock: boolean) => {
  // useRef to hold the WakeLockSentinel object, initially null
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  // useRef to hold the promise for the Tauri window's onFocusChanged unlisten function, initially null
  const unlistenOnFocusChangedRef = useRef<Promise<() => void> | null>(null);

  useEffect(() => {
    /**
     * Requests the screen wake lock from the navigator.
     * If successful, it adds a 'release' event listener to clear the ref when the lock is released.
     */
    const requestWakeLock = async () => {
      try {
        // Check if the Wake Lock API is available in the navigator
        if ('wakeLock' in navigator) {
          // Request a screen wake lock
          wakeLockRef.current = await navigator.wakeLock.request('screen');

          // Add an event listener for when the wake lock is released
          wakeLockRef.current.addEventListener('release', () => {
            // Clear the wakeLockRef when the lock is released
            wakeLockRef.current = null;
          });

          console.log('Wake lock acquired');
        }
      } catch (err) {
        // Log an error if the wake lock could not be acquired
        console.info('Failed to acquire wake lock:', err);
      }
    };

    /**
     * Releases the screen wake lock.
     * If a lock is currently held, it's released and the ref is cleared.
     */
    const releaseWakeLock = () => {
      // Check if a wake lock is currently held
      if (wakeLockRef.current) {
        // Release the wake lock
        wakeLockRef.current.release();
        // Clear the wakeLockRef
        wakeLockRef.current = null;
        console.log('Wake lock released');
      }
    };
    // Function to handle visibility changes in the web platform.
    const handleVisibilityChange = () => {
      if (document.hidden) {
        releaseWakeLock();
      } else {
        requestWakeLock();
      }
    };

    // Depending on the value of lock, request or release the wake lock.
    if (lock) {
      requestWakeLock();
    } else if (wakeLockRef.current) {
      releaseWakeLock();
    }

    // Check if the current platform is a web app and if the lock is enabled
    if (isWebAppPlatform() && lock) {
      // Add an event listener to handle visibility changes of the document
      document.addEventListener('visibilitychange', handleVisibilityChange);
      // Check if the current platform is a Tauri app and if the lock is enabled
    } else if (isTauriAppPlatform() && lock) {
      // Listen for focus changes of the current Tauri window
      unlistenOnFocusChangedRef.current = getCurrentWindow().onFocusChanged(
        // Callback function to execute when the window focus changes
        ({ payload: focused }) => {
          // If the window gains focus, request a wake lock
          if (focused) {
            requestWakeLock();
            // If the window loses focus, release the wake lock
          } else {
            releaseWakeLock();
          }
        },
      );
    }
    // Cleanup function for the useEffect hook
    return () => {
      releaseWakeLock();
      if (isWebAppPlatform() && lock) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (unlistenOnFocusChangedRef.current) {
        unlistenOnFocusChangedRef.current.then((f) => f());
      }
    };
    // The useEffect hook re-runs whenever the lock variable changes
  }, [lock]);
};
