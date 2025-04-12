import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import { impactFeedback } from '@tauri-apps/plugin-haptics';
import { useSettingsStore } from '@/store/settingsStore';
import { useBookDataStore } from '@/store/bookDataStore';
import { useReaderStore } from '@/store/readerStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { BookSearchResult } from '@/types/book';
import { eventDispatcher } from '@/utils/event';
import { getBookDirFromLanguage } from '@/utils/book';
import { useEnv } from '@/context/EnvContext';
import { useDrag } from '@/hooks/useDrag';
import { useThemeStore } from '@/store/themeStore';
import SidebarHeader from './Header';
import SidebarContent from './Content';
import BookCard from './BookCard';
import useSidebar from '../../hooks/useSidebar';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import useShortcuts from '@/hooks/useShortcuts';
// Minimum width for the sidebar (5% of the screen width).
const MIN_SIDEBAR_WIDTH = 0.05;
// Maximum width for the sidebar (45% of the screen width).
const MAX_SIDEBAR_WIDTH = 0.45;

// Velocity threshold to determine if a vertical drag is a swipe to close.
const VELOCITY_THRESHOLD = 0.5;

// Functional component for the sidebar.
const SideBar: React.FC<{
  onGoToLibrary: () => void;
}> = ({ onGoToLibrary }) => {
  // Access environment variables and services.
  const { appService } = useEnv();
  // Access theme store to update the app theme.
  const { updateAppTheme } = useThemeStore();
  // Access settings store for global reading settings.
  const { settings } = useSettingsStore();
  // Access sidebar store for sidebar state management.
  const { sideBarBookKey } = useSidebarStore();
  // Access book data store to get book details.
  const { getBookData } = useBookDataStore();
  // Access reader store to manage the reader view.
  const { getView, getViewSettings } = useReaderStore();
  // State to manage the search bar visibility.
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);
  // State to store search results.
  const [searchResults, setSearchResults] = useState<BookSearchResult[] | null>(null);
  // State to store the current search term.
  const [searchTerm, setSearchTerm] = useState('');
  // Check if the window width is for mobile.
  const isMobile = window.innerWidth < 640;
  const {
    // sidebar state and actions
    sideBarWidth,
    isSideBarPinned,
    isSideBarVisible,
    setSideBarVisible,
    handleSideBarResize,
    handleSideBarTogglePin,
  } = useSidebar(
    settings.globalReadSettings.sideBarWidth,
    isMobile ? false : settings.globalReadSettings.isSideBarPinned,
  );

  // Event handler for the 'search' event.
  const onSearchEvent = async (event: CustomEvent) => {
    const { term } = event.detail;
    setSideBarVisible(true);
    setIsSearchBarVisible(true);
    setSearchTerm(term);
  };

  // Event handler for the 'navigate' event.
  const onNavigateEvent = async () => {
    const pinButton = document.querySelector('.sidebar-pin-btn');
    const isPinButtonHidden = !pinButton || window.getComputedStyle(pinButton).display === 'none';
    if (isPinButtonHidden) {
      setSideBarVisible(false);
    }
  };

  // Update the app theme based on the sidebar's visibility.
  useEffect(() => {
    if (isSideBarVisible) {
      updateAppTheme('base-200');
    } else {
      updateAppTheme('base-100');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSideBarVisible]);
  // Listen for 'search' and 'navigate' events.

  useEffect(() => {
    eventDispatcher.on('search', onSearchEvent);
    eventDispatcher.on('navigate', onNavigateEvent);
    return () => {
      eventDispatcher.off('search', onSearchEvent);
      eventDispatcher.off('navigate', onNavigateEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle the vertical drag movement (mobile only).
  const handleVerticalDragMove = (data: { clientY: number }) => {
    if (!isMobile) return;

    const heightFraction = data.clientY / window.innerHeight;
    const newTop = Math.max(0.0, Math.min(1, heightFraction));

    const sidebar = document.querySelector('.sidebar-container') as HTMLElement;
    const overlay = document.querySelector('.overlay') as HTMLElement;

    if (sidebar && overlay) {
      sidebar.style.top = `${newTop * 100}%`;
      overlay.style.opacity = `${1 - heightFraction}`;
    }
  };

  // Handle the vertical drag end (mobile only).
  const handleVerticalDragEnd = (data: { velocity: number; clientY: number }) => {
    const sidebar = document.querySelector('.sidebar-container') as HTMLElement;
    const overlay = document.querySelector('.overlay') as HTMLElement;

    if (!sidebar || !overlay) return;

    if (
      data.velocity > VELOCITY_THRESHOLD ||
      (data.velocity >= 0 && data.clientY >= window.innerHeight * 0.5)
    ) {
      const transitionDuration = 0.15 / Math.max(data.velocity, 0.5);
      sidebar.style.transition = `top ${transitionDuration}s ease-out`;
      sidebar.style.top = '100%';
      overlay.style.transition = `opacity ${transitionDuration}s ease-out`;
      overlay.style.opacity = '0';
      setTimeout(() => setSideBarVisible(false), 300);
      if (appService?.hasHaptics) {
        impactFeedback('medium');
      }
    } else {
      sidebar.style.transition = 'top 0.3s ease-out';
      sidebar.style.top = '0%';
      overlay.style.transition = 'opacity 0.3s ease-out';
      overlay.style.opacity = '0.8';
      if (appService?.hasHaptics) {
        impactFeedback('medium');
      }
    }
  };

  // Handle the horizontal drag movement.
  const handleHorizontalDragMove = (data: { clientX: number }) => {
    const widthFraction = data.clientX / window.innerWidth;
    const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, widthFraction));
    handleSideBarResize(`${Math.round(newWidth * 10000) / 100}%`);
  };
  // Create drag handlers.

  const { handleDragStart: handleVerticalDragStart } = useDrag(
    handleVerticalDragMove,
    handleVerticalDragEnd,
  );
  const { handleDragStart: handleHorizontalDragStart } = useDrag(handleHorizontalDragMove);

  const handleClickOverlay = () => {
    // Close the sidebar on overlay click.
    setSideBarVisible(false);
  };

  const handleToggleSearchBar = () => {
    // Toggle the search bar visibility and reset search results.
    setIsSearchBarVisible((prev) => !prev);
    if (isSearchBarVisible) {
      setSearchResults(null);
      setSearchTerm('');
      getView(sideBarBookKey)?.clearSearch();
    }
  };

  // Define shortcuts.
  useShortcuts({ onToggleSearchBar: handleToggleSearchBar }, [sideBarBookKey]);

  // Handle search result click.
  const handleSearchResultClick = (cfi: string) => {
    onNavigateEvent();
    getView(sideBarBookKey)?.goTo(cfi);
  };

  // Exit if the sidebar is not active.
  if (!sideBarBookKey) return null;
  // Get view and book data.
  const viewSettings = getViewSettings(sideBarBookKey);
  // Get book data.
  const bookData = getBookData(sideBarBookKey);
  if (!bookData || !bookData.book || !bookData.bookDoc) {
    return null;
  }
  const { book, bookDoc } = bookData;
  const languageDir = getBookDirFromLanguage(bookDoc.metadata.language);

  // Render the sidebar.
  return isSideBarVisible ? (
    <>
      <div
        className={clsx(
          'sidebar-container bg-base-200 z-20 flex min-w-60 select-none flex-col',
          appService?.isIOSApp ? 'h-[100vh]' : 'h-full',
          appService?.hasSafeAreaInset && 'pt-[env(safe-area-inset-top)]',
          appService?.hasRoundedWindow && 'rounded-window-top-left rounded-window-bottom-left',
          !isSideBarPinned && 'shadow-2xl',
        )}
        dir={viewSettings?.rtl && languageDir === 'rtl' ? 'rtl' : 'ltr'}
        style={{
          width: `${sideBarWidth}`,
          maxWidth: `${MAX_SIDEBAR_WIDTH * 100}%`,
          position: isSideBarPinned ? 'relative' : 'absolute',
        }}
      >
        <style jsx>{`
          @media (max-width: 640px) {
            .sidebar-container {
              width: 100%;
              min-width: 100%;
              border-top-left-radius: 16px;
              border-top-right-radius: 16px;
            }
            .sidebar-container.open {
              top: 0%;
            }
            .overlay {
              transition: opacity 0.3s ease-in-out;
            }
          }
        `}</style>
        <div className='flex-shrink-0'>
          {isMobile && (
            <div
              className='drag-handle flex h-10 w-full cursor-row-resize items-center justify-center'
              onMouseDown={handleVerticalDragStart}
              onTouchStart={handleVerticalDragStart}
            >
              <div className='bg-base-content/50 h-1 w-10 rounded-full'></div>
            </div>
          )}
          {/* Render the sidebar header */}
          <SidebarHeader
            isPinned={isSideBarPinned}
            isSearchBarVisible={isSearchBarVisible}
            onGoToLibrary={onGoToLibrary}
            onClose={() => setSideBarVisible(false)}
            onTogglePin={handleSideBarTogglePin}
            onToggleSearchBar={handleToggleSearchBar}
          />
          {/* Render the search bar. */}
          <div
            className={clsx('search-bar', {
              'search-bar-visible': isSearchBarVisible,
            })}
          >
            <SearchBar
              isVisible={isSearchBarVisible}
              bookKey={sideBarBookKey!}
              searchTerm={searchTerm}
              onSearchResultChange={setSearchResults}
            />
          </div>
          <div className='border-base-300/50 border-b px-3'>
            {/* Display the book card */}
            <BookCard book={book} />
          </div>
        </div>
        {isSearchBarVisible && searchResults ? (
          <SearchResults
            bookKey={sideBarBookKey!}
            results={searchResults}
            onSelectResult={handleSearchResultClick}
          />
        ) : (
          // Render the main content of the sidebar
          <SidebarContent bookDoc={bookDoc} sideBarBookKey={sideBarBookKey!} />
        )}
        <div
          className='drag-bar absolute right-0 top-0 h-full w-0.5 cursor-col-resize'
          onMouseDown={handleHorizontalDragStart}
          // Render the horizontal drag bar.
        ></div>
      </div>
      {!isSideBarPinned && (
        <div
          className='overlay fixed inset-0 z-10 bg-black/50 sm:bg-black/20'
          onClick={handleClickOverlay}
        />
      )}
    </>
  ) : null;
};

export default SideBar;
