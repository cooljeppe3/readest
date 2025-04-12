import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { PiDotsThreeVerticalBold } from 'react-icons/pi';
// Import necessary contexts, stores, and hooks.
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useTrafficLightStore } from '@/store/trafficLightStore';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
// Import components for the header bar.
import WindowButtons from '@/components/WindowButtons';
import Dropdown from '@/components/Dropdown';
// Import components specific to the reader view.
import SidebarToggler from './SidebarToggler';
import BookmarkToggler from './BookmarkToggler';
import NotebookToggler from './NotebookToggler';
import SettingsToggler from './SettingsToggler';
import ViewMenu from './ViewMenu';

interface HeaderBarProps {
  // Define the properties for the HeaderBar component.
  bookKey: string;
  bookTitle: string;
  isTopLeft: boolean;
  isHoveredAnim: boolean;
  onCloseBook: (bookKey: string) => void;
  onSetSettingsDialogOpen: (open: boolean) => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  // Destructure the properties passed to the HeaderBar component.
  bookKey,
  bookTitle,
  isTopLeft,
  isHoveredAnim,
  onCloseBook,
  onSetSettingsDialogOpen,
}) => {
  // Access the application service from the environment context.
  const { appService } = useEnv();
  // Create a ref for the header bar element.
  const headerRef = useRef<HTMLDivElement>(null);
  // Access the traffic light store to manage traffic light visibility.
  const {
    isTrafficLightVisible,
    setTrafficLightVisibility,
    initializeTrafficLightStore,
    initializeTrafficLightListeners,
    cleanupTrafficLightListeners,
  } = useTrafficLightStore();
  // State to manage the visibility of the dropdown menu.
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { hoveredBookKey, setHoveredBookKey, bookKeys } = useReaderStore(); // Access the reader store to manage the hovered book and book keys.
  const { isSideBarVisible } = useSidebarStore();
  const iconSize16 = useResponsiveSize(16);

  const handleToggleDropdown = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
    if (!isOpen) setHoveredBookKey('');
  };

  useEffect(() => {
    // If the app does not have a traffic light, return.
    if (!appService?.hasTrafficLight) return;
    // Initialize the traffic light store and listeners.
    initializeTrafficLightStore(appService);
    initializeTrafficLightListeners();
    setTrafficLightVisibility(true);
    return () => {
      // Cleanup the traffic light listeners when the component unmounts.
      cleanupTrafficLightListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!appService?.hasTrafficLight) return;
    // Update traffic light visibility based on sidebar visibility.
    setTrafficLightVisibility(isSideBarVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSideBarVisible]);

  return (
    <div
      ref={headerRef}
      className={clsx(
        // Base styles for the header bar.
        `header-bar absolute top-0 z-10 flex h-11 w-full items-center pr-4`,
        // Conditional padding based on traffic light and sidebar visibility.
        isTrafficLightVisible && isTopLeft && !isSideBarVisible ? 'pl-16' : 'pl-4',
        // Styles for background, shadow, and transition.
        `shadow-xs bg-base-100 transition-opacity duration-300`,
        // Conditional styling for rounded windows.
        appService?.hasRoundedWindow && 'rounded-window-top-right',
        !isSideBarVisible && appService?.hasRoundedWindow && 'rounded-window-top-left',
        // Hover animation class.
        isHoveredAnim && 'hover-bar-anim',
        // Conditional visibility based on hover and dropdown state.
        hoveredBookKey === bookKey || isDropdownOpen ? `visible` : `opacity-0`,
        // Class to pin the header bar when dropdown is open.
        isDropdownOpen && 'header-bar-pinned',
      )}
      // Handle hover events for the header bar.
      onMouseEnter={() => setHoveredBookKey(bookKey)}
      onMouseLeave={() => setHoveredBookKey('')}
    >
      <div className='sidebar-bookmark-toggler bg-base-100 z-20 flex h-full items-center gap-x-4'>
        {/* Sidebar toggler (hidden on small screens). */}
        <div className='hidden sm:flex'>
          <SidebarToggler bookKey={bookKey} />
        </div>
        <BookmarkToggler bookKey={bookKey} />
      </div>
      {/* Center title of the book in the header bar. */}
      <div className='header-title z-15 pointer-events-none absolute inset-0 hidden items-center justify-center sm:flex'>
        <h2 className='line-clamp-1 max-w-[50%] text-center text-xs font-semibold'>{bookTitle}</h2>
      </div>
      {/* Right-side buttons and dropdown menu. */}
      <div className='bg-base-100 z-20 ml-auto flex h-full items-center space-x-4'>
        <SettingsToggler />
        <NotebookToggler bookKey={bookKey} />
        <Dropdown
          className='exclude-title-bar-mousedown dropdown-bottom dropdown-end'
          buttonClassName='btn btn-ghost h-8 min-h-8 w-8 p-0'
          toggleButton={<PiDotsThreeVerticalBold size={iconSize16} />}
          onToggle={handleToggleDropdown}
        >
          <ViewMenu bookKey={bookKey} onSetSettingsDialogOpen={onSetSettingsDialogOpen} />
        </Dropdown>
        {/* Window buttons for minimize, maximize, and close. */}
        <WindowButtons
          className='window-buttons flex h-full items-center'
          headerRef={headerRef}
          // Conditional display of minimize button.
          showMinimize={
            bookKeys.length == 1 && !isTrafficLightVisible && appService?.appPlatform !== 'web'
          }
          // Conditional display of maximize button.
          showMaximize={
            bookKeys.length == 1 && !isTrafficLightVisible && appService?.appPlatform !== 'web'
          }
          onClose={() => onCloseBook(bookKey)}
        />
      </div>
    </div>
  );
};

export default HeaderBar;
