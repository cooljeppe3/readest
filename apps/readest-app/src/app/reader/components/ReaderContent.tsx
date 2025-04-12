'use client';

// Import utility libraries for class name manipulation and React functionality.
import clsx from 'clsx';
import * as React from 'react';
// Import React hooks for state management and side effects.
import { useState, useRef, useEffect } from 'react';
// Import Next.js navigation hooks.
import { useRouter, useSearchParams } from 'next/navigation';

// Import custom hooks for managing application environment and store data.
import { useEnv } from '@/context/EnvContext';
import { useSettingsStore } from '@/store/settingsStore';
import { useBookDataStore } from '@/store/bookDataStore';
import { useReaderStore } from '@/store/readerStore';
import { useSidebarStore } from '@/store/sidebarStore';
// Import type definitions for book and system settings.
import { Book } from '@/types/book';
import { SystemSettings } from '@/types/settings';
// Import utility functions for parsing files, managing window operations, and environment checks.
import { parseOpenWithFiles } from '@/helpers/cli';
import { tauriHandleClose, tauriHandleOnCloseWindow } from '@/utils/window';
import { isTauriAppPlatform } from '@/services/environment';
import { uniqueId } from '@/utils/misc';
import { eventDispatcher } from '@/utils/event';
import { navigateToLibrary } from '@/utils/nav';
// Import constant values.
import { BOOK_IDS_SEPARATOR } from '@/services/constants';

// Import custom hooks for managing books and shortcuts.
import useBooksManager from '../hooks/useBooksManager';
import useBookShortcuts from '../hooks/useBookShortcuts';
// Import UI components.
import BookDetailModal from '@/components/BookDetailModal';
import Spinner from '@/components/Spinner';
import SideBar from './sidebar/SideBar';
import Notebook from './notebook/Notebook';
import BooksGrid from './BooksGrid';
import TTSControl from './tts/TTSControl';

// Define the ReaderContent component, the main content area for the reader view.
const ReaderContent: React.FC<{ ids?: string; settings: SystemSettings }> = ({ ids, settings }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { envConfig, appService } = useEnv();
  const { bookKeys, dismissBook, getNextBookKey } = useBooksManager();
  const { sideBarBookKey, setSideBarBookKey } = useSidebarStore();
  const { saveSettings } = useSettingsStore();
  const { getConfig, getBookData, saveConfig } = useBookDataStore();
  const { getView, setBookKeys } = useReaderStore();
  const { initViewState, getViewState, clearViewState } = useReaderStore(); // Methods for managing view states of books.

  // State for managing whether to show the book details modal.
  const [showDetailsBook, setShowDetailsBook] = useState<Book | null>(null);
  // Ref for tracking if the reader view is initiating.
  const isInitiating = useRef(false);
  // State for managing the loading status of the reader view.
  const [loading, setLoading] = useState(false);

  // Hook for managing book-related keyboard shortcuts.
  useBookShortcuts({ sideBarBookKey, bookKeys });

  // useEffect hook to handle initial setup of books when the component mounts.
  useEffect(() => {
    // Prevents the setup from running multiple times unnecessarily.
    if (isInitiating.current) return;
    isInitiating.current = true;

    // Determine the book IDs from props or query parameters.
    const bookIds = ids || searchParams?.get('ids') || '';
    const initialIds = bookIds.split(BOOK_IDS_SEPARATOR).filter(Boolean);
    const initialBookKeys = initialIds.map((id) => `${id}-${uniqueId()}`);
    setBookKeys(initialBookKeys);
    // Handle initialization of book view states.
    const uniqueIds = new Set<string>();
    console.log('Initialize books', initialBookKeys);
    initialBookKeys.forEach((key, index) => {
      const id = key.split('-')[0]!;
      const isPrimary = !uniqueIds.has(id);
      uniqueIds.add(id);
      if (!getViewState(key)) {
        initViewState(envConfig, id, key, isPrimary).catch((error) => {
          console.log('Error initializing book', key, error);
        });
        if (index === 0) setSideBarBookKey(key);
      }
    });
    // Listener to show details of a specific book.

    const handleShowBookDetails = (event: CustomEvent) => {
      const book = event.detail as Book;
      setShowDetailsBook(book);
      return true;
    };
    eventDispatcher.onSync('show-book-details', handleShowBookDetails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect hook for managing application closing.
  useEffect(() => {
    // Set up Tauri close window handler if the application is running in a Tauri environment.
    if (isTauriAppPlatform()) tauriHandleOnCloseWindow(handleCloseBooks);
    // Set up beforeunload event listener to handle closing when the window is closed.
    window.addEventListener('beforeunload', handleCloseBooks);
    // Set up listener to handle closing of the app
    eventDispatcher.on('quit-app', handleCloseBooks);
    // Clean up event listeners when the component unmounts.
    return () => {
      window.removeEventListener('beforeunload', handleCloseBooks);
      eventDispatcher.off('quit-app', handleCloseBooks);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookKeys]); // Re-run the effect if the bookKeys change.

  // Helper function to save book configurations.
  const saveBookConfig = async (bookKey: string) => {
    const config = getConfig(bookKey);
    const { book } = getBookData(bookKey) || {};
    const { isPrimary } = getViewState(bookKey) || {};
    if (isPrimary && book && config) { // Save config only for primary books.
      eventDispatcher.dispatch('sync-book-progress', { bookKey });
      const settings = useSettingsStore.getState().settings;
      await saveConfig(envConfig, bookKey, config, settings);
    }
  };

  const saveConfigAndCloseBook = async (bookKey: string) => {
    console.log('Closing book', bookKey);
    try {
      getView(bookKey)?.close();
      getView(bookKey)?.remove();
    } catch {
      console.info('Error closing book', bookKey);
    }
    eventDispatcher.dispatch('tts-stop', { bookKey });
    await saveBookConfig(bookKey);
    clearViewState(bookKey);
  };

  // Helper function to save settings and navigate to the library.
  const saveSettingsAndGoToLibrary = () => {
    saveSettings(envConfig, settings);
    navigateToLibrary(router);
  };

  // Function to handle closing all books and saving settings.
  const handleCloseBooks = async () => {
    const settings = useSettingsStore.getState().settings;
    await Promise.all(bookKeys.map((key) => saveConfigAndCloseBook(key)));
    await saveSettings(envConfig, settings);
  };

  const handleCloseBooksToLibrary = () => {
    handleCloseBooks();
    navigateToLibrary(router);
  };
  
  // Function to handle closing an individual book.
  const handleCloseBook = async (bookKey: string) => {
    saveConfigAndCloseBook(bookKey);
    // Update the sidebar's book key if the closed book is the current sidebar book.
    if (sideBarBookKey === bookKey) {
      setSideBarBookKey(getNextBookKey(sideBarBookKey));
    }
    dismissBook(bookKey);
    // Handle navigation or closing based on remaining books.
    if (bookKeys.filter((key) => key !== bookKey).length == 0) {
      const openWithFiles = (await parseOpenWithFiles()) || [];
      if (openWithFiles.length > 0) {
        // Close the app if there are open-with files.
        tauriHandleClose();
      } else {
        // Save settings and navigate to the library if there are no open-with files.
        saveSettingsAndGoToLibrary();
      }
    }
  };

  // If there are no book keys, do not display the Reader.
  if (!bookKeys || bookKeys.length === 0) return null;
  // Try to load the first book.
  const bookData = getBookData(bookKeys[0]!);
  // If the book is not loaded show the loading.
  if (!bookData || !bookData.book || !bookData.bookDoc) {
    setTimeout(() => setLoading(true), 300);
    // Show loading spinner when the book is not loaded.
    return (
      loading && (
        <div className={clsx('hero hero-content', appService?.isIOSApp ? 'h-[100vh]' : 'h-dvh')}>
          <Spinner loading={true} />
        </div>
      )
    );
  }

  // Render the main layout with the sidebar, book grid, TTS control, and notebook.
  return (
    <div className={clsx('flex', appService?.isIOSApp ? 'h-[100vh]' : 'h-dvh')}>
      <SideBar onGoToLibrary={handleCloseBooksToLibrary} />
      <BooksGrid bookKeys={bookKeys} onCloseBook={handleCloseBook} />
      <TTSControl />
      <Notebook />
      {showDetailsBook && (
        <BookDetailModal
          isOpen={!!showDetailsBook}
          book={showDetailsBook}
          onClose={() => setShowDetailsBook(null)}
        />
      )}
    </div>
  );
};

// Export the ReaderContent component.
export default ReaderContent;
