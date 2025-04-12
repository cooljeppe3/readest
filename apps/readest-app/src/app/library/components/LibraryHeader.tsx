// Import necessary modules and components.
import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Import icons from react-icons.
import { FaSearch } from 'react-icons/fa';
import { PiPlus } from 'react-icons/pi';
import { PiSelectionAllDuotone } from 'react-icons/pi';
import { MdOutlineMenu, MdArrowBackIosNew } from 'react-icons/md';
import { IoMdCloseCircle } from 'react-icons/io';

// Import custom hooks and utility functions.
import { useEnv } from '@/context/EnvContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTrafficLightStore } from '@/store/trafficLightStore';
import { navigateToLibrary } from '@/utils/nav';
import { throttle } from '@/utils/throttle';
// Import custom components.
import WindowButtons from '@/components/WindowButtons';
import Dropdown from '@/components/Dropdown';
import SettingsMenu from './SettingsMenu';
import ImportMenu from './ImportMenu';
import useShortcuts from '@/hooks/useShortcuts';

// Define the interface for the LibraryHeader component's props.
interface LibraryHeaderProps {
  // Indicates whether the select mode is active.
  isSelectMode: boolean;
  // Callback function to handle the import books action.
  onImportBooks: () => void;
  // Callback function to toggle the select mode.
  onToggleSelectMode: () => void;
}

// Define the LibraryHeader component.
// This component renders the header section of the library page, including search, import, select, and settings controls.
// It handles the logic for searching books, importing books, toggling select mode, and navigating to other views.
const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  isSelectMode,
  onImportBooks,
  onToggleSelectMode,
}) => {
  const _ = useTranslation();
  const router = useRouter();
  // Get the search parameters from the URL.
  const searchParams = useSearchParams();
  // Access the application environment and services.
  const { appService } = useEnv();
  // Access the traffic light store for managing the visibility of traffic light window buttons.
  const {
    isTrafficLightVisible,
    initializeTrafficLightStore,
    initializeTrafficLightListeners,
    setTrafficLightVisibility,
    cleanupTrafficLightListeners,
  } = useTrafficLightStore(); // State variable to hold the current search query.

  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') ?? '');
  // Reference to the header div element.
  const headerRef = useRef<HTMLDivElement>(null);
  // Responsive icon sizes.
  const iconSize16 = useResponsiveSize(16);
  const iconSize20 = useResponsiveSize(20);

  // Use custom shortcut hook for keyboard shortcuts.
  // The shortcut is used for toggling select mode.
  useShortcuts({
    onToggleSelectMode,
  });

  // Throttled function to update the search query parameter in the URL.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledUpdateQueryParam = useCallback(
    throttle((value: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      router.push(`?${params.toString()}`);
    }, 1000),
    [searchParams],
  );

  // Handler for the search input change event.
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    throttledUpdateQueryParam(newQuery);
  };

  // Initialize traffic light store and listeners on component mount.
  useEffect(() => {
    if (!appService?.hasTrafficLight) return;

    initializeTrafficLightStore(appService);
    initializeTrafficLightListeners();
    setTrafficLightVisibility(true);
    return () => {
      cleanupTrafficLightListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine if window buttons are visible based on the app service and traffic light visibility.
  const windowButtonVisible = appService?.hasWindowBar && !isTrafficLightVisible;
  // Determine if the current view is a group view based on the search parameters.
  const isInGroupView = !!searchParams?.get('group');

  // Return the JSX to render the LibraryHeader.
  return (
    // Main container for the header section.
    <div
      ref={headerRef}
      className={clsx(
        'titlebar z-10 flex h-[52px] w-full items-center py-2 pr-4 sm:h-[48px] sm:pr-6',
        appService?.hasSafeAreaInset && 'mt-[env(safe-area-inset-top)]',
        isTrafficLightVisible ? 'pl-16' : 'pl-0 sm:pl-2',
      )}
    >
      {/* Container for the header content, including search and other controls. */}
      <div className='flex w-full items-center justify-between space-x-6 sm:space-x-12'>
        <div className='exclude-title-bar-mousedown relative flex w-full items-center pl-4'>
          {/* Back button for navigating out of group views. */}
          {isInGroupView && (
            <button
              onClick={() => {
                navigateToLibrary(router);
              }}
              className='ml-[-6px] mr-4 flex h-7 min-h-7 w-7 items-center p-0'
            >
              <div className='lg:tooltip lg:tooltip-bottom' data-tip={_('Go Back')}>
                <MdArrowBackIosNew size={iconSize20} />
              </div>
            </button>
          )}
          {/* Search input field and clear button. */}
          <div className='relative flex h-9 w-full items-center sm:h-7'>
            <span className='absolute left-3 text-gray-500'>
              <FaSearch className='h-4 w-4' />
            </span>
            <input
              type='text'
              value={searchQuery}
              placeholder={_('Search Books...')}
              onChange={handleSearchChange}
              spellCheck='false'
              className={clsx(
                'input rounded-badge bg-base-300/50 h-9 w-full pl-10 pr-10 sm:h-7',
                'font-sans text-sm font-light',
                'border-none focus:outline-none focus:ring-0',
              )}
            />
          </div>
          {/* Additional controls for clearing the search and importing books. */}
          <div className='absolute right-4 flex items-center space-x-2 text-gray-500 sm:space-x-4'>
            {searchQuery && (
              <button
                type='button'
                onClick={() => {
                  setSearchQuery('');
                  throttledUpdateQueryParam('');
                }}
                className='text-gray-400 hover:text-gray-600'
                aria-label={_('Clear Search')}
              >
                <IoMdCloseCircle className='h-4 w-4' />
              </button>
            )}
            {/* Separator between the search clear button and the import button */}
            <span className='bg-base-content/50 mx-2 h-4 w-[0.5px]'></span>
            <Dropdown
              className='exclude-title-bar-mousedown dropdown-bottom flex h-6 cursor-pointer justify-center'
              buttonClassName='p-0 h-6 min-h-6 w-6 flex items-center justify-center'
              toggleButton={
                <div className='lg:tooltip lg:tooltip-bottom' data-tip={_('Import Books')}>
                  <PiPlus className='m-0.5 h-5 w-5' />
                </div>
              }
            >
              <ImportMenu onImportBooks={onImportBooks} />
            </Dropdown>
            {/* Button for toggling select mode. */}
            <button
              onClick={onToggleSelectMode}
              aria-label={_('Select Multiple Books')}
              className='h-6'
            >
              <div
                className='lg:tooltip lg:tooltip-bottom cursor-pointer'
                data-tip={_('Select Books')}
              >
                <PiSelectionAllDuotone
                  role='button'
                  className={`h-6 w-6 ${isSelectMode ? 'fill-gray-400' : 'fill-gray-500'}`}
                />
              </div>
            </button>
          </div>
        </div>
        {/* Container for the settings dropdown and window buttons. */}
        <div className='flex h-full items-center gap-x-2 sm:gap-x-4'>
          <Dropdown
            className='exclude-title-bar-mousedown dropdown-bottom dropdown-end'
            buttonClassName='btn btn-ghost h-8 min-h-8 w-8 p-0'
            toggleButton={<MdOutlineMenu size={iconSize16} />}
          >
            <SettingsMenu />
          </Dropdown>
          {/* Window buttons for native applications. */}
          {appService?.hasWindowBar && (
            <WindowButtons
              headerRef={headerRef}
              showMinimize={windowButtonVisible}
              showMaximize={windowButtonVisible}
              showClose={windowButtonVisible}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Export the LibraryHeader component.
export default LibraryHeader;
