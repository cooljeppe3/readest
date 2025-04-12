// Import necessary modules and components
import clsx from 'clsx';
import React from 'react';
import Image from 'next/image';

// Import custom components and utilities
import MenuItem from '@/components/MenuItem';
import { setAboutDialogVisible } from '@/components/AboutWindow';
import { useLibraryStore } from '@/store/libraryStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useTranslation } from '@/hooks/useTranslation';
import { isWebAppPlatform } from '@/services/environment';
import { eventDispatcher } from '@/utils/event'; // Utility for dispatching custom events
import { DOWNLOAD_READEST_URL } from '@/services/constants';
import useBooksManager from '../../hooks/useBooksManager';

// Define the interface for BookMenu component props
interface BookMenuProps {
  menuClassName?: string; // Optional CSS class name for the menu
  setIsDropdownOpen?: (isOpen: boolean) => void; // Optional function to set the dropdown open state
}

// Define the BookMenu functional component
const BookMenu: React.FC<BookMenuProps> = ({ menuClassName, setIsDropdownOpen }) => {
  // Get translation function from useTranslation hook
  const _ = useTranslation(); 
  // Get visible library function from useLibraryStore hook
  const { getVisibleLibrary } = useLibraryStore(); 
  // Get openParallelView function from useBooksManager hook
  const { openParallelView } = useBooksManager(); 
  // Get the current book key from useSidebarStore hook
  const { sideBarBookKey } = useSidebarStore(); 

  // Function to handle opening parallel view for a book
  const handleParallelView = (id: string) => {
    // Open the parallel view with the given book ID
    openParallelView(id);
    // Close the dropdown menu
    setIsDropdownOpen?.(false);
  };
  const handleReloadPage = () => {
    window.location.reload();
    setIsDropdownOpen?.(false);
  };
  const showAboutReadest = () => {
    setAboutDialogVisible(true);
    setIsDropdownOpen?.(false);
  };
  const downloadReadest = () => {
    window.open(DOWNLOAD_READEST_URL, '_blank');
    setIsDropdownOpen?.(false);
  };
  // Handle exporting annotations for current book
  const handleExportAnnotations = () => {
    // Dispatch an event to export annotations with the current book key
    eventDispatcher.dispatch('export-annotations', { bookKey: sideBarBookKey });
    // Close the dropdown menu
    setIsDropdownOpen?.(false);
  };

  const isWebApp = isWebAppPlatform(); // Check if the platform is a web app

  return (
    // Main container for the book menu
    <div
      tabIndex={0}
      className={clsx(
        'book-menu dropdown-content border-base-100 z-20 w-60 shadow-2xl', // Base styles for the dropdown menu
        menuClassName,
      )}
    >
      <MenuItem label={_('Parallel Read')} noIcon>
        <ul className='max-h-60 overflow-y-auto'>
          {getVisibleLibrary()
            .filter((book) => book.format !== 'PDF' && book.format !== 'CBZ')
            .slice(0, 20)
            .map((book) => (
              <MenuItem
                key={book.hash}
                icon={
                  <Image
                    src={book.coverImageUrl!}
                    alt={book.title}
                    width={56}
                    height={80}
                    className='aspect-auto max-h-8 max-w-6 rounded-sm shadow-md'
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                }
                label={book.title}
                labelClass='max-w-36'
                onClick={() => handleParallelView(book.hash)}
              />
            ))}
        </ul>
      </MenuItem>
      {/* Menu item for exporting annotations */}
      <MenuItem label={_('Export Annotations')} noIcon onClick={handleExportAnnotations} />
      {/* Menu item for reloading the page */}
      <MenuItem label={_('Reload Page')} noIcon shortcut='Shift+R' onClick={handleReloadPage} />
      <hr className='border-base-200 my-1' />
      {/* Conditionally render the download Readest menu item */}
      {isWebApp && <MenuItem label={_('Download Readest')} noIcon onClick={downloadReadest} />}
      {/* Menu item for showing the about dialog */}
      <MenuItem label={_('About Readest')} noIcon onClick={showAboutReadest} />
    </div>
  );
};
// Export the BookMenu component
export default BookMenu;
