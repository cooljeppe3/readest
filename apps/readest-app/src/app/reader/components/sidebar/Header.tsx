import clsx from 'clsx';
import React from 'react';
import { GiBookshelf } from 'react-icons/gi';
import { FiSearch } from 'react-icons/fi';
import { MdOutlineMenu, MdOutlinePushPin, MdPushPin } from 'react-icons/md';
import { MdArrowBackIosNew } from 'react-icons/md';

import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useTrafficLightStore } from '@/store/trafficLightStore';
import Dropdown from '@/components/Dropdown';
import BookMenu from './BookMenu';
/**
 * SidebarHeader component - Renders the header of the sidebar in the reader view.
 *
 * This component includes controls for:
 * - Closing the sidebar (on smaller screens).
 * - Navigating back to the library.
 * - Toggling the search bar visibility.
 * - Accessing the book menu (dropdown).
 * - Toggling the sidebar pin state (on larger screens).
 *
 * @param isPinned - A boolean indicating if the sidebar is pinned.
 * @param isSearchBarVisible - A boolean indicating if the search bar is visible.
 * @param onGoToLibrary - Callback function to navigate to the library.
 * @param onClose - Callback function to close the sidebar.
 * @param onTogglePin - Callback function to toggle the sidebar's pinned state.
 * @param onToggleSearchBar - Callback function to toggle the search bar's visibility.
 */
const SidebarHeader: React.FC<{
  isPinned: boolean;
  isSearchBarVisible: boolean;
  onGoToLibrary: () => void;
  onClose: () => void;
  onTogglePin: () => void;
  onToggleSearchBar: () => void; // Callback function to toggle the search bar's visibility.
}> = ({ isPinned, isSearchBarVisible, onGoToLibrary, onClose, onTogglePin, onToggleSearchBar }) => { 
  // Accessing the traffic light store to check if the traffic light is visible.
  const { isTrafficLightVisible } = useTrafficLightStore();
  // Responsive sizes for icons.
  const iconSize14 = useResponsiveSize(14);
  const iconSize18 = useResponsiveSize(18);
  const iconSize22 = useResponsiveSize(22);

  return (
    <div
      className={clsx(
        'sidebar-header flex h-11 items-center justify-between pe-2', // Default styling for the header.
        // Adjust padding based on traffic light visibility.
        isTrafficLightVisible ? 'pl-20' : 'ps-1.5',
      )}
      dir='ltr'
    >
      <div className='flex items-center gap-x-8'> 
        {/* Close button (visible on smaller screens) */}
        {/* Close button (visible on smaller screens) */}
        <button
          onClick={onClose}
          className={'btn btn-ghost btn-circle flex h-6 min-h-6 w-6 hover:bg-transparent sm:hidden'}
        >
          <MdArrowBackIosNew size={iconSize22} />
        </button>
        <button
          className='btn btn-ghost hidden h-8 min-h-8 w-8 p-0 sm:flex' // Hidden on smaller screens, visible on larger screens.
          onClick={onGoToLibrary}
        >
          <GiBookshelf className='fill-base-content' />
        </button>
      </div>
      {/* Controls container: search toggle, dropdown menu, and pin toggle. */}
      {/* Controls container: search toggle, dropdown menu, and pin toggle. */}
      {/* Controls container: search toggle, dropdown menu, and pin toggle. */}
      <div className='flex min-w-24 max-w-32 items-center justify-between sm:size-[70%]'>
        <button
          onClick={onToggleSearchBar}
          className={clsx(
            'btn btn-ghost left-0 h-8 min-h-8 w-8 p-0',
            isSearchBarVisible ? 'bg-base-300' : '',
          )}
        >
          <FiSearch size={iconSize18} className='text-base-content' />
        </button>
        {/* Book menu dropdown */}
        <Dropdown
          className={clsx(
            window.innerWidth < 640 && 'dropdown-end',
            'dropdown-bottom flex justify-center',
          )}
          menuClassName={window.innerWidth < 640 ? 'no-triangle mt-1' : 'dropdown-center mt-3'}
          buttonClassName='btn btn-ghost h-8 min-h-8 w-8 p-0'
          toggleButton={<MdOutlineMenu className='fill-base-content' />}
        >
          <BookMenu />
        </Dropdown>
        {/* Sidebar pin toggle button (visible on larger screens) */}
        {/* Sidebar pin toggle button (visible on larger screens) */}
        <div className='right-0 hidden h-8 w-8 items-center justify-center sm:flex'>
          <button
            onClick={onTogglePin}
            className={clsx(
              'sidebar-pin-btn btn btn-ghost btn-circle hidden h-6 min-h-6 w-6 sm:flex',
              isPinned ? 'bg-base-300' : 'bg-base-300/65',
            )}
          >
            {isPinned ? <MdPushPin size={iconSize14} /> : <MdOutlinePushPin size={iconSize14} />}
          </button>
        </div>
      </div>
    </div>
  );
};
 // Exporting the SidebarHeader component.
export default SidebarHeader;
