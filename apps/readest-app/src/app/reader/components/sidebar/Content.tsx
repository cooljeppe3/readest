import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

// Importing necessary types and contexts.
import { BookDoc } from '@/libs/document';
import { useEnv } from '@/context/EnvContext';
import { useBookDataStore } from '@/store/bookDataStore';

// Importing child components for different sidebar views.
import TOCView from './TOCView';
import BooknoteView from './BooknoteView';
import TabNavigation from './TabNavigation';

// Define the props for the SidebarContent component
const SidebarContent: React.FC<{
  bookDoc: BookDoc; // The book document object containing the book's data.
  sideBarBookKey: string; // Unique key for the book in the sidebar.
}> = ({ bookDoc, sideBarBookKey }) => {
  // Accessing the environment context for appService.
  const { appService } = useEnv();
  // Ref for the scrollable container element.
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Accessing the book data store to manage book-specific configurations.
  const { getConfig, setConfig } = useBookDataStore();
  // Retrieve the configuration for the current book.
  const config = getConfig(sideBarBookKey);
  // State to track the currently active tab in the sidebar (default to 'toc').
  const [activeTab, setActiveTab] = useState(config?.viewSettings?.sideBarTab || 'toc');
  // State to control the fade effect when switching tabs.
  const [fade, setFade] = useState(false);
  // State to store the target tab for rendering after the fade effect.
  const [targetTab, setTargetTab] = useState(activeTab);

  // useEffect hook to handle the scrollbar's visibility on the scrollable content.
  useEffect(() => {
    // Get the container element.
    const container = scrollContainerRef.current;
    // If container doesn't exist, exit early.
    if (!container) return;

    // Variable to store the timeout for hiding the scrollbar.
    let scrollTimeout: ReturnType<typeof setTimeout>;
    // Function to show the scrollbar by removing the 'hidden-scrollbar' class.
    const showScrollbar = () => {
      container.classList.remove('hidden-scrollbar');
    };
    // Function to hide the scrollbar by adding the 'hidden-scrollbar' class.
    const hideScrollbar = () => {
      container.classList.add('hidden-scrollbar');
    };

    // Initially hide the scrollbar.
    hideScrollbar();
    const handleScroll = () => {
      showScrollbar();
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(hideScrollbar, 2000);
    };
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // useEffect hook to update the active tab when the book key changes.
  useEffect(() => {
    // If no book key, exit early.
    if (!sideBarBookKey) return;
    // Get the configuration for the current book.
    const config = getConfig(sideBarBookKey!)!;
    // Set the active tab based on the book's view settings.
    setActiveTab(config.viewSettings!.sideBarTab!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sideBarBookKey]);

  // Handler for tab changes in the sidebar.
  const handleTabChange = (tab: string) => {
    // Initiate the fade effect.
    setFade(true);
    // Set a timeout to handle the tab switch after the fade effect.
    const timeout = setTimeout(() => {
      // Remove the fade effect.
      setFade(false);
      // Set the target tab for rendering.
      setTargetTab(tab);
      // Save the updated configuration.
      setConfig(sideBarBookKey!, config);
      // Clear the timeout.
      clearTimeout(timeout);
    }, 300);

    // Update the active tab immediately.
    setActiveTab(tab);
    // Get the current configuration.
    const config = getConfig(sideBarBookKey!)!;
    // Update the sidebar tab in the view settings.
    config.viewSettings!.sideBarTab = tab;
  };

  return (
    <>
      {/* Container for the main sidebar content */}
      <div
        className={clsx(
          'sidebar-content flex min-h-0 flex-grow flex-col shadow-inner',
          'font-sans text-base font-normal sm:text-sm',
        )}
      >
        <div
          // Ref for the scroll container.
          ref={scrollContainerRef}
          className={clsx(
            'scroll-container overflow-y-auto transition-opacity duration-300 ease-in-out',
            { 'opacity-0': fade, 'opacity-100': !fade },
          )}
        >
          {/* Render the TOC view if the target tab is 'toc' and book has toc */}
          {targetTab === 'toc' && bookDoc.toc && (
            <TOCView toc={bookDoc.toc} bookKey={sideBarBookKey} />
          )}
          {/* Render the BooknoteView for annotations if the target tab is 'annotations' */}
          {targetTab === 'annotations' && (
            <BooknoteView type='annotation' toc={bookDoc.toc ?? []} bookKey={sideBarBookKey} />
          )}
          {/* Render the BooknoteView for bookmarks if the target tab is 'bookmarks' */}
          {targetTab === 'bookmarks' && (
            <BooknoteView type='bookmark' toc={bookDoc.toc ?? []} bookKey={sideBarBookKey} />
          )}
        </div>
      </div>
      <div
        // Container for the tab navigation.
        className={clsx(
          'flex-shrink-0',
          appService?.hasSafeAreaInset && 'pb-[calc(env(safe-area-inset-bottom)/2)]',
        )}
      >
        {/* Tab navigation component */}
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </>
  );
};

export default SidebarContent;
