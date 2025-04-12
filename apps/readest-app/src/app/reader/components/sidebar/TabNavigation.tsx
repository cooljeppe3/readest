import clsx from 'clsx';
import React from 'react';
import { MdBookmarkBorder as BookmarkIcon } from 'react-icons/md'; // Bookmark icon from react-icons
import { IoIosList as TOCIcon } from 'react-icons/io'; // Table of Contents (TOC) icon from react-icons
import { PiNotePencil as NoteIcon } from 'react-icons/pi'; // Note/Annotation icon from react-icons

import { useTranslation } from '@/hooks/useTranslation'; // Hook for handling translations

// Type definition for the TabNavigation component's props
const TabNavigation: React.FC<{
  activeTab: string; // Currently active tab ('toc', 'annotations', or 'bookmarks')
  onTabChange: (tab: string) => void; // Callback function to handle tab changes
}> = ({ activeTab, onTabChange }) => {
  const _ = useTranslation(); // Initialize the translation hook

  // Array of available tabs
  const tabs = ['toc', 'annotations', 'bookmarks']; // 'toc' (Table of Contents), 'annotations', and 'bookmarks'

  return (
    // Main container for the tab navigation bar
    <div
      className={clsx(
        'bottom-tab border-base-300/50 bg-base-200 relative flex w-full border-t',
      )} // Styling classes for the tab bar
      dir='ltr' // Set the text direction to left-to-right
    >
      {/* Indicator for the currently active tab */}
      <div
        className={clsx(
          'bg-base-300 absolute bottom-1.5 start-1 h-[calc(100%-12px)] w-[calc(33.3%-8px)] rounded-lg', // Styling classes for the indicator
          'transform transition-transform duration-300', // Classes for smooth transition
          // Conditional classes to position the indicator based on the active tab
          activeTab === 'toc' && 'translate-x-0', // If 'toc' is active, no translation
          activeTab === 'annotations' &&
            'translate-x-[calc(100%+8px)]', // If 'annotations' is active, translate to the right by 100% + 8px
          activeTab === 'bookmarks' &&
            'translate-x-[calc(200%+16px)]', // If 'bookmarks' is active, translate to the right by 200% + 16px
        )}
      />
      {/* Map over the tabs array and render a tab for each item */}
      {tabs.map((tab) => (
        // Individual tab container
        <div
          key={tab} // Unique key for each tab
          className='lg:tooltip lg:tooltip-top z-50 m-1.5 flex-1 cursor-pointer rounded-md p-2' // Styling classes for the tab
          data-tip={
            tab === 'toc' ? _('TOC') : tab === 'annotations' ? _('Annotate') : _('Bookmark')
          }
        >
          <div className={clsx('flex h-6 items-center')} onClick={() => onTabChange(tab)}>
            {tab === 'toc' ? (
              <TOCIcon className='mx-auto' />
            // Render the TOC icon
            ) : tab === 'annotations' ? (
              <NoteIcon className='mx-auto' />
            // Render the Note/Annotation icon
            ) : (
              <BookmarkIcon className='mx-auto' />
            // Render the Bookmark icon
            )}
          </div>
        // Render the appropriate icon based on the tab type
        </div>
      ))}
    </div>
  );
};

// Export the TabNavigation component as the default export
export default TabNavigation;
