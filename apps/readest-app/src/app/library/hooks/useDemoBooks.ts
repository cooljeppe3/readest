import { useEffect, useRef, useState } from 'react';

// Import the necessary context and types
import { useEnv } from '@/context/EnvContext';
import { Book } from '@/types/book';
// Import utility function to get the user's language
import { getUserLang } from '@/utils/misc';
// Import utility function to check if the platform is a web app
import { isWebAppPlatform } from '@/services/environment';

// Import demo library data for English and Chinese
import libraryEn from '@/data/demo/library.en.json';
import libraryZh from '@/data/demo/library.zh.json';

// Define a mapping of language codes to their respective demo libraries
const libraries = {
  en: libraryEn,
  zh: libraryZh,
};

// Define the structure of the demo books data
interface DemoBooks {
  library: string[];
}

// Define a custom hook called useDemoBooks
export const useDemoBooks = () => {
  // Get the environment configuration from the EnvContext
  const { envConfig } = useEnv();
  // Determine the user's language (either 'en' or 'zh')
  const userLang = getUserLang() as keyof typeof libraries;
  // State to hold the array of demo books
  const [books, setBooks] = useState<Book[]>([]);
  // Ref to track if demo books are currently being loaded
  const isLoading = useRef(false);

  // useEffect hook to fetch and load demo books
  useEffect(() => {
    // If demo books are already loading, exit early
    if (isLoading.current) return;
    // Set the loading flag to true
    isLoading.current = true;

    // Define an async function to fetch the demo books
    const fetchDemoBooks = async () => {
      try {
        // Get the app service based on the environment configuration
        const appService = await envConfig.getAppService();
        // Get the appropriate demo library based on user language or default to English
        const demoBooks = libraries[userLang] || (libraries.en as DemoBooks);
        // Map over each URL in the demo library and import the corresponding book
        const books = await Promise.all(
          demoBooks.library.map((url) =>
            // Use the app service to import each book
            appService.importBook(url, [], false, true),
          ),
        );
        // Filter out any null values and set the books state with the imported books
        setBooks(books.filter((book) => book !== null) as Book[]);
      } catch (error) {
        // Log any errors that occur during the fetching or importing of demo books
        console.error('Failed to import demo books:', error);
      }
    };

    const demoBooksFetchedFlag = localStorage.getItem('demoBooksFetched');
    if (isWebAppPlatform() && !demoBooksFetchedFlag) {
      fetchDemoBooks();
      // Set a flag in local storage to prevent re-fetching on subsequent loads
      localStorage.setItem('demoBooksFetched', 'true');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Empty dependency array means this effect runs once on mount
  }, []);

  // Return the array of demo books
  return books;
};

// This code defines a custom hook that loads a set of demo books
// based on the user's language preference, only in a web app platform, and only once.
