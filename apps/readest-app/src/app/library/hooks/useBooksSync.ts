import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEnv } from '@/context/EnvContext';
import { useSync } from '@/hooks/useSync';
import { useLibraryStore } from '@/store/libraryStore';
import { SYNC_BOOKS_INTERVAL_SEC } from '@/services/constants';
import { Book } from '@/types/book';

// Interface to define optional callbacks for sync start and end events.
export interface UseBooksSyncProps {
  onSyncStart?: () => void;
  onSyncEnd?: () => void;
}

// Custom hook for managing book synchronization between the local library and a remote server.
export const useBooksSync = ({ onSyncStart, onSyncEnd }: UseBooksSyncProps) => {
  // Access user authentication status.
  const { user } = useAuth();
  // Access environment variables and app service methods.
  const { appService } = useEnv();
  // Access the library state and method to update it.
  const { library, setLibrary } = useLibraryStore();
  // Access the synchronization state and method.
  const { syncedBooks, syncBooks, lastSyncedAtBooks } = useSync();
  // Reference to check if pulling is in progress.
  const syncBooksPullingRef = useRef(false);

  // Function to pull the library from the server.
  const pullLibrary = async () => {
    if (!user) return;
    // Initiate synchronization with 'pull' direction.
    syncBooks([], 'pull');
  };

  // Function to push the library to the server.
  const pushLibrary = async () => {
    if (!user) return;
    // Get new or updated books to be synced.
    const newBooks = getNewBooks();
    // Initiate synchronization with 'push' direction.
    syncBooks(newBooks, 'push');
  };

  // Effect to initiate pulling the library when the component mounts.
  useEffect(() => {
    if (!user) return;
    // Prevent multiple pulls at the same time.
    if (syncBooksPullingRef.current) return;
    syncBooksPullingRef.current = true;
    // Pull library immediately.
    pullLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reference to track the last synchronization time.
  const lastSyncTime = useRef<number>(0);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getNewBooks = () => {
    if (!user) return [];
    const newBooks = library.filter(
      (book) => lastSyncedAtBooks < book.updatedAt || lastSyncedAtBooks < (book.deletedAt ?? 0),
    );
    return newBooks;
  };

  // Effect to periodically synchronize the library.
  useEffect(() => {
    if (!user) return;
    // Get current time.
    const now = Date.now();
    // Calculate the time since the last synchronization.
    const timeSinceLastSync = now - lastSyncTime.current;
    // If the time since the last sync is greater than the specified interval.
    if (timeSinceLastSync > SYNC_BOOKS_INTERVAL_SEC * 1000) {
      lastSyncTime.current = now; // Update the last sync time.
      const newBooks = getNewBooks();
      syncBooks(newBooks, 'both');
    } else {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(
        () => {
          lastSyncTime.current = Date.now();
          const newBooks = getNewBooks();
          syncBooks(newBooks, 'both');
          syncTimeoutRef.current = null;
        },
        SYNC_BOOKS_INTERVAL_SEC * 1000 - timeSinceLastSync,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library]);

  // Function to update the local library with the newly synchronized books.
  const updateLibrary = async () => {
    if (!syncedBooks?.length) return;
    // Process old books first so that when we update the library the order is preserved
    syncedBooks.sort((a, b) => a.updatedAt - b.updatedAt);

    const processOldBook = async (oldBook: Book) => {
      const matchingBook = syncedBooks.find((newBook) => newBook.hash === oldBook.hash);
      // If there is a matching book in the sync results.
      if (matchingBook) {
        // Check if the matching book needs to be downloaded.
        if (!matchingBook.deletedAt && matchingBook.uploadedAt && !oldBook.downloadedAt) {
          await appService?.downloadBook(oldBook, true);
        }
        // Merge the old and new book data.
        const mergedBook =
          matchingBook.updatedAt > oldBook.updatedAt
            ? { ...oldBook, ...matchingBook }
            : { ...matchingBook, ...oldBook };
        return mergedBook;
      }
      return oldBook;
    };

    const updatedLibrary = await Promise.all(library.map(processOldBook));
    const processNewBook = async (newBook: Book) => {
      // Check if a new book needs to be added to the local library.
      if (!updatedLibrary.some((oldBook) => oldBook.hash === newBook.hash)) {
        if (newBook.uploadedAt && !newBook.deletedAt) {
          // Try to download the new book and update its cover image URL.
          try {
            await appService?.downloadBook(newBook, true);
            newBook.coverImageUrl = await appService?.generateCoverImageUrl(newBook);
            updatedLibrary.push(newBook);
            setLibrary(updatedLibrary);
          } catch {
            console.error('Failed to download book:', newBook);
          }
        }
      }
    };    
    // Call onSyncStart callback if provided.
    onSyncStart?.();
    // Process new books in batches to avoid overwhelming the system.
    const batchSize = 3;
    for (let i = 0; i < syncedBooks.length; i += batchSize) {
      const batch = syncedBooks.slice(i, i + batchSize);
      await Promise.all(batch.map(processNewBook));
    }
    // Call onSyncEnd callback if provided.
    onSyncEnd?.();
    // Update the local library and save it.
    setLibrary(updatedLibrary);
    appService?.saveLibraryBooks(updatedLibrary);
  };

  // Effect to update the local library whenever there are new synced books.
  useEffect(() => {
    updateLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedBooks]);

  return { pullLibrary, pushLibrary };
};
