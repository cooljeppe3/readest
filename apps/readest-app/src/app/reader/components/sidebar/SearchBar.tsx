import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { FaSearch, FaChevronDown } from 'react-icons/fa';
import { useEnv } from '@/context/EnvContext';
import { useSettingsStore } from '@/store/settingsStore';
import { useBookDataStore } from '@/store/bookDataStore';
import { useReaderStore } from '@/store/readerStore';
import { useTranslation } from '@/hooks/useTranslation';
import { BookSearchConfig, BookSearchResult } from '@/types/book';
import { useResponsiveSize } from '@/hooks/useResponsiveSize'; // Import the useResponsiveSize hook
import Dropdown from '@/components/Dropdown'; // Import the Dropdown component
import SearchOptions from './SearchOptions'; // Import the SearchOptions component
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import Dropdown from '@/components/Dropdown';
import SearchOptions from './SearchOptions';

// Define minimum search term lengths for different character sets
const MINIMUM_SEARCH_TERM_LENGTH_DEFAULT = 2;
const MINIMUM_SEARCH_TERM_LENGTH_CJK = 1;

// Define the structure of props expected by the SearchBar component
interface SearchBarProps {
  isVisible: boolean; // Indicates whether the search bar is visible
  bookKey: string; // The unique key of the book being searched
  searchTerm: string; // The current search term in the input field
  onSearchResultChange: (results: BookSearchResult[]) => void; // Callback function to update search results
}

// Main SearchBar component
const SearchBar: React.FC<SearchBarProps> = ({
  isVisible, // Destructure the isVisible prop
  bookKey, // Destructure the bookKey prop
  searchTerm: term, // Destructure and rename the searchTerm prop to term
  onSearchResultChange, // Destructure the onSearchResultChange prop
}) => {
  // Access translation function
  const _ = useTranslation(); // Use the useTranslation hook for localization
  // Access environment configurations
  const { envConfig } = useEnv(); // Use the useEnv hook to get environment configurations
  // Access settings store
  const { settings } = useSettingsStore(); // Use the useSettingsStore hook to get settings
  // Access book data store
  const { getConfig, saveConfig } = useBookDataStore(); // Use the useBookDataStore hook to manage book configurations
  // Access reader store
  const { getView, getProgress } = useReaderStore(); // Use the useReaderStore hook to manage reader views and progress
  // State to manage the search term
  const [searchTerm, setSearchTerm] = useState(term); // State variable for the current search term
  // Ref to the input field
  const inputRef = useRef<HTMLInputElement>(null); // Ref to the search input element

  // Retrieve book-specific data from stores
  // Get the current view for the book
  const view = getView(bookKey)!;
  const config = getConfig(bookKey)!;
  const progress = getProgress(bookKey)!;
  const searchConfig = config.searchConfig! as BookSearchConfig;

  const queuedSearchTerm = useRef('');
  const isSearchPending = useRef(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Calculate responsive icon sizes
  const iconSize12 = useResponsiveSize(12);
  const iconSize16 = useResponsiveSize(16);

  // Effect to handle changes in the bookKey
  useEffect(() => {
    handleSearchTermChange(searchTerm); // Call handleSearchTermChange when the bookKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps // Disable exhaustive-deps for bookKey
  }, [bookKey]); // Dependency array: effect runs when bookKey changes

  // Effect to handle changes in the search term prop
  useEffect(() => {
    setSearchTerm(term); // Update the local searchTerm state
    handleSearchTermChange(term); // Call handleSearchTermChange when the term prop changes
    // eslint-disable-next-line react-hooks/exhaustive-deps // Disable exhaustive-deps for term
  }, [term]); // Dependency array: effect runs when term changes

  // Effect to focus on the input when the search bar becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus(); // Focus on the input element
    }
  }, [isVisible]); // Dependency array: effect runs when isVisible changes

  // Effect to handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If the 'Escape' key is pressed and the input is focused
      if (e.key === 'Escape' && inputRef.current) {
        inputRef.current.blur(); // Remove focus from the input
      }
    };
    // Add the event listener
    window.addEventListener('keydown', handleKeyDown);
    // Cleanup function to remove the event listener and clear the timeout
    return () => {
      // Remove the event listener
      window.removeEventListener('keydown', handleKeyDown);
      // If there's a timeout, clear it
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []); // Empty dependency array: effect runs once on mount and unmount

  // Handler for input field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // Get the new value from the input
    setSearchTerm(value); // Update the state with the new value

    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (!isSearchPending.current) {
        handleSearchTermChange(value);
      } else {
        queuedSearchTerm.current = value;
      }
    }, 500); // Set a 500ms delay to avoid immediate searches
  };

  // Handler for search configuration changes
  const handleSearchConfigChange = (searchConfig: BookSearchConfig) => {
    config.searchConfig = searchConfig; // Update the configuration object
    saveConfig(envConfig, bookKey, config, settings); // Save the new configuration
    handleSearchTermChange(searchTerm); // Re-run the search
  };

  // Check if the search term exceeds the minimum length
  const exceedMinSearchTermLength = (searchTerm: string) => {
    // Check if the term contains CJK characters
    const isCJK = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(searchTerm);
    // Determine the minimum length based on whether CJK characters are present
    const minLength = isCJK ? MINIMUM_SEARCH_TERM_LENGTH_CJK : MINIMUM_SEARCH_TERM_LENGTH_DEFAULT;
    // Return whether the term length meets the minimum requirement
    return searchTerm.length >= minLength;
  };

  const handleSearchTermChange = (term: string) => {
    if (exceedMinSearchTermLength(term)) {
      handleSearch(term);
    } else {
      resetSearch();
    }
  };

  // Asynchronous function to perform the search
  const handleSearch = async (term: string) => {
    console.log('searching for:', term); // Log the search term
    isSearchPending.current = true; // Set the search pending flag
    const { section } = progress; // Destructure the section from the progress
    const index = searchConfig.scope === 'section' ? section.current : undefined; // Determine the search index
    const generator = await view.search({ ...searchConfig, query: term, index }); // Perform the search
    const results: BookSearchResult[] = []; // Initialize an array for results
    for await (const result of generator) { // Iterate over the search results
      if (typeof result === 'string') { // Check if the result is a string
        if (result === 'done') { // Check if the result is 'done'
          onSearchResultChange([...results]); // Callback with the results
          isSearchPending.current = false; // Reset the search pending flag
          console.log('search done'); // Log that the search is done
          if ( // Check if there's a queued search term
            queuedSearchTerm.current !== term && // Check if the queued term is different
            exceedMinSearchTermLength(queuedSearchTerm.current) // Check if it meets the min length
          ) {
            handleSearch(queuedSearchTerm.current); // Run the queued search
          }
        }
      } else { // If the result is not a string
        if (result.progress) { // Check for progress
          //console.log('search progress:', result.progress);
        } else { // If it's a search result
          results.push(result); // Add the result to the array
          onSearchResultChange([...results]); // Callback with the results
        }
      }
    }
  };

  // Function to reset the search
  const resetSearch = () => {
    onSearchResultChange([]); // Clear search results
    view?.clearSearch(); // Clear the search in the view
  };

  return (
    <div className='relative p-2'>
      <div className='bg-base-100 flex h-8 items-center rounded-lg'>
        <div className='pl-3'>
          <FaSearch size={iconSize16} className='text-gray-500' />
        </div> {/* Search Icon */}

        <input
          ref={inputRef} // Reference to the input
          type='text'
          value={searchTerm}
          spellCheck={false}
          onChange={handleInputChange}
          placeholder={_('Search...')}
          className='w-full bg-transparent p-2 font-sans text-sm font-light focus:outline-none'
        />
        {/* Dropdown for search options */}
        <div className='bg-base-300 flex h-8 w-8 items-center rounded-r-lg'>
          <Dropdown
            className={clsx(
              window.innerWidth < 640 && 'dropdown-end',
              'dropdown-bottom flex justify-center',
            )}
            menuClassName={window.innerWidth < 640 ? 'no-triangle mt-1' : 'dropdown-center mt-3'}
            buttonClassName='btn btn-ghost h-8 min-h-8 w-8 p-0 rounded-none rounded-r-lg'
            toggleButton={<FaChevronDown size={iconSize12} className='text-gray-500' />} // Dropdown toggle button
          >
            {/* Search Options Component */}
            <SearchOptions
              searchConfig={searchConfig} // Pass searchConfig to the SearchOptions component
              onSearchConfigChanged={handleSearchConfigChange}
            />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};
// Export the SearchBar component
export default SearchBar;

