import React from 'react';
// Importing icons from 'react-icons/tb' for the sidebar toggle button.
import { TbLayoutSidebar, TbLayoutSidebarFilled } from 'react-icons/tb';

// Importing custom stores and hooks for application state and translation.
import { useReaderStore } from '@/store/readerStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useTranslation } from '@/hooks/useTranslation';
import Button from '@/components/Button';

// Defining the props for the SidebarToggler component.
interface SidebarTogglerProps {
  // bookKey: A unique identifier for the book, used to manage sidebar visibility.
  bookKey: string;
}

// SidebarToggler component: Manages the visibility of the sidebar for a specific book.
const SidebarToggler: React.FC<SidebarTogglerProps> = ({ bookKey }) => {
  // Accessing the translation function from the useTranslation hook.
  const _ = useTranslation();
  // Accessing the sidebar state from the useSidebarStore hook.
  const { sideBarBookKey, isSideBarVisible, setSideBarBookKey, toggleSideBar } = useSidebarStore();
  // Accessing the reader state from the useReaderStore hook.
  const { setHoveredBookKey } = useReaderStore();

  // handleToggleSidebar: Handles the logic for toggling the sidebar.
  const handleToggleSidebar = () => {
    // If the sidebar is currently open for this book, toggle it closed.
    if (sideBarBookKey === bookKey) {
      toggleSideBar();
    } else {
      // If the sidebar is open for another book, or closed, set this book as the active one.
      setSideBarBookKey(bookKey);
      // If the sidebar was closed, open it now.
      if (!isSideBarVisible) toggleSideBar();
    }
    // Clear the hovered book key to remove any highlighting effects.
    setHoveredBookKey('');
  };

  // Render the button that toggles the sidebar.
  return (
    <Button
      // Render the filled sidebar icon if the sidebar is visible and belongs to the current book.
      // Otherwise, render the empty sidebar icon.
      icon={
        sideBarBookKey === bookKey && isSideBarVisible ? (
          <TbLayoutSidebarFilled className='text-base-content' />
        ) : (
          <TbLayoutSidebar className='text-base-content' />
        )
      }
      // Call handleToggleSidebar when the button is clicked.
      onClick={handleToggleSidebar}
      // Set the tooltip text.
      tooltip={_('Sidebar')}
      // Set the direction of the tooltip.
      tooltipDirection='bottom'
    />
  );
};

export default SidebarToggler;
