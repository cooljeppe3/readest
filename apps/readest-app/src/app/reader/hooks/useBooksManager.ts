import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { uniqueId } from '@/utils/misc';
import { useParallelViewStore } from '@/store/parallelViewStore';
import { navigateToReader } from '@/utils/nav';

/**
 * useBooksManager is a custom hook that manages the state and interactions of books within the reader view.
 * It handles adding, removing, and switching between books, as well as updating the URL to reflect the current state.
 */
const useBooksManager = () => {
  // Accessing Next.js router and search parameters.
  const router = useRouter();
  const searchParams = useSearchParams();

  // Accessing the environment configuration.
  const { envConfig } = useEnv();

  // Accessing the reader store for managing book keys.
  const { bookKeys } = useReaderStore();

  // Functions from the reader store for setting and initializing the book view state.
  const { setBookKeys, initViewState } = useReaderStore();

  // Managing the sidebar book key for parallel view.
  const { sideBarBookKey, setSideBarBookKey } = useSidebarStore();

  // State variable to determine if the search parameters should be updated.
  const [shouldUpdateSearchParams, setShouldUpdateSearchParams] = useState(false);

  // Function to set parallel views.
  const { setParallel } = useParallelViewStore();

  // Effect to update the URL when bookKeys change or when instructed to update the search parameters.
  useEffect(() => {
    if (shouldUpdateSearchParams) {
      // Extracting book IDs from the book keys.
      const ids = bookKeys.map((key) => key.split('-')[0]!);
      if (ids) {
        // Navigating to the reader with the new book IDs and search parameters.
        navigateToReader(router, ids, searchParams?.toString() || '', { scroll: false });
      }
      // Resetting the flag after updating the URL.
      setShouldUpdateSearchParams(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookKeys, shouldUpdateSearchParams]);

  // Appends a new book to the reader view, initializing its view state and updating the URL.
  const appendBook = (id: string, isPrimary: boolean, isParallel: boolean) => {
    const newKey = `${id}-${uniqueId()}`;
    initViewState(envConfig, id, newKey, isPrimary);
    if (!bookKeys.includes(newKey)) {
      // Adding the new book key to the existing book keys.
      const updatedKeys = [...bookKeys, newKey];
      setBookKeys(updatedKeys);
    }
    if (isParallel) setParallel(sideBarBookKey!, newKey);
    setSideBarBookKey(newKey);
    setShouldUpdateSearchParams(true);
  };
  /**
   * Dismisses a book from the reader view and updates the URL.
   * @param bookKey - The unique key of the book to be dismissed.
   */
  const dismissBook = (bookKey: string) => {
    // Filtering out the book key to be dismissed.
    const updatedKeys = bookKeys.filter((key) => key !== bookKey);
    setBookKeys(updatedKeys);
    setShouldUpdateSearchParams(true);
  };

  // Gets the next book key in the sequence for cycling through books.
  const getNextBookKey = (bookKey: string) => {
    // Finding the index of the current book key.
    const index = bookKeys.findIndex((key) => key === bookKey);
    // Calculating the index of the next book key in a circular manner.
    const nextIndex = (index + 1) % bookKeys.length;
    // Returning the next book key.
    return bookKeys[nextIndex]!;
  };

  /**
   * Opens a parallel view with the specified book ID.
   * @param id - The ID of the book to be opened in parallel view.
   */
  const openParallelView = (id: string) => {
    const sideBarBookId = sideBarBookKey?.split('-')[0];
    appendBook(id, sideBarBookId != id, true);
  };
  // Returning the functions and values needed.
  return {
    bookKeys,
    appendBook,
    dismissBook,
    getNextBookKey,
    openParallelView,
  };
};

export default useBooksManager;
