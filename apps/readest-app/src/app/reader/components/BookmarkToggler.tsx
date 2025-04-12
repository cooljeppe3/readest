import React, { useEffect, useState } from 'react';
import { MdOutlineBookmarkAdd, MdOutlineBookmark } from 'react-icons/md';
import * as CFI from 'foliate-js/epubcfi.js';
// Import necessary stores, hooks, and utility functions
import { useSettingsStore } from '@/store/settingsStore';
import { useBookDataStore } from '@/store/bookDataStore';
import { useReaderStore } from '@/store/readerStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useEnv } from '@/context/EnvContext';
import { BookNote } from '@/types/book'; // Type definition for a book note
import { uniqueId } from '@/utils/misc'; // Function to generate a unique ID
import Button from '@/components/Button';
import { getCurrentPage } from '@/utils/book'; // Function to get the current page of a book

// Interface for the props of the BookmarkToggler component
interface BookmarkTogglerProps {
  bookKey: string; // The unique key of the book
}

// Functional component for toggling bookmarks
const BookmarkToggler: React.FC<BookmarkTogglerProps> = ({ bookKey }) => {
  const _ = useTranslation(); // Hook for translations
  const { envConfig } = useEnv(); // Hook to access environment configuration
  const { settings } = useSettingsStore(); // Hook to access settings store
  const {
    getConfig, // Function to get book configuration
    saveConfig, // Function to save book configuration
    getBookData, // Function to get book data
    updateBooknotes, // Function to update booknotes
  } = useBookDataStore();
  const {
    getProgress, // Function to get reading progress
    setBookmarkRibbonVisibility, // Function to set the visibility of the bookmark ribbon
  } = useReaderStore();
  const config = getConfig(bookKey)!; // Get the configuration for the specified book
  const progress = getProgress(bookKey)!; // Get the reading progress for the specified book
  const bookData = getBookData(bookKey)!; // Get the book data for the specified book

  const [isBookmarked, setIsBookmarked] = useState(false); // State to track if the current location is bookmarked

  /**
   * Toggles the bookmark status for the current location in the book.
   * If the current location is not bookmarked, it adds a new bookmark.
   * If the current location is bookmarked, it removes the bookmark.
   */
  const toggleBookmark = () => {
    const { booknotes: bookmarks = [] } = config; // Get the bookmarks from the book configuration, default to an empty array
    const { location: cfi, range } = progress; // Get the current location and range from the reading progress
    if (!cfi) return; // If there is no CFI (location data), exit the function

    // Check if the location is currently bookmarked
    if (!isBookmarked) {
      setIsBookmarked(true); // Update the state to indicate that the location is bookmarked

      // Get a short excerpt of the selected text or current page
      const text = range?.startContainer.textContent?.slice(0, 128) || '';
      
      // Truncate text if necessary
      const truncatedText = text.length === 128 ? text + '...' : text;

      // Create a new bookmark object
      const bookmark: BookNote = {
        id: uniqueId(),
        type: 'bookmark',
        cfi,
        text: truncatedText ? truncatedText : `${getCurrentPage(bookData.book!, progress)}`,
        note: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // Check if a bookmark already exists at this location
      const existingBookmark = bookmarks.find(
        (item) => item.type === 'bookmark' && item.cfi === cfi,
      );
      // Update if it exists or create a new bookmark
      if (existingBookmark) {
        existingBookmark.deletedAt = null; //Remove delete mark
        existingBookmark.updatedAt = Date.now(); // Update the modification date
        existingBookmark.text = bookmark.text; // Update the text with the new one
      } else {
        bookmarks.push(bookmark); // Add the new bookmark to the bookmarks array
      }
      const updatedConfig = updateBooknotes(bookKey, bookmarks); // Update the booknotes in the store

      // Save updated config
      if (updatedConfig) {
        saveConfig(envConfig, bookKey, updatedConfig, settings); // Save the updated configuration
      }
    } else {
      setIsBookmarked(false); // Update the state to indicate that the location is no longer bookmarked
      
      // Define the start and end of the current location
      const start = CFI.collapse(cfi);
      const end = CFI.collapse(cfi, true);

      // Iterate through existing bookmarks
      bookmarks.forEach((item) => {
        // Check if the item is a bookmark and within the current range
        if (
          item.type === 'bookmark' &&
          CFI.compare(start, item.cfi) * CFI.compare(end, item.cfi) <= 0
        ) {
          item.deletedAt = Date.now(); // Mark the bookmark as deleted
        }
      });
      const updatedConfig = updateBooknotes(bookKey, bookmarks); // Update the booknotes in the store

      // Save the updated configuration
      if (updatedConfig) {
        saveConfig(envConfig, bookKey, updatedConfig, settings); // Save the updated configuration
      }
    }
  };

  /**
   * Effect hook to update the bookmark state when the configuration or progress changes.
   */
  useEffect(() => {
    const { booknotes = [] } = config || {}; // Get the bookmarks from the configuration, default to an empty array
    const { location: cfi } = progress || {}; // Get the current location from the reading progress
    if (!cfi) return; // If there is no CFI (location data), exit the effect

    const start = CFI.collapse(cfi); // Get the start of the current location
    const end = CFI.collapse(cfi, true); // Get the end of the current location

    // Check if the current location is bookmarked
    const locationBookmarked = booknotes
      .filter((booknote) => booknote.type === 'bookmark' && !booknote.deletedAt) // Filter to get bookmarks that are not marked as deleted
      .some((item) => CFI.compare(start, item.cfi) * CFI.compare(end, item.cfi) <= 0); // Check if any of the bookmarks are in the current location
    setIsBookmarked(locationBookmarked); // Update the bookmark state
    setBookmarkRibbonVisibility(bookKey, locationBookmarked); // Set the visibility of the bookmark ribbon
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, progress]);

  return (
    <Button
      icon={
        isBookmarked ? (
          <MdOutlineBookmark className='text-base-content' />
        ) : (
          <MdOutlineBookmarkAdd className='text-base-content' />
        )
      }
      onClick={toggleBookmark}
      tooltip={_('Bookmark')}
      tooltipDirection='bottom' // Set the tooltip direction
    />
  );
};

export default BookmarkToggler;
