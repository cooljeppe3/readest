import React from 'react';
import { LuNotebookPen } from 'react-icons/lu';

// Import necessary stores and hooks from the application.
import { useSidebarStore } from '@/store/sidebarStore';
import { useNotebookStore } from '@/store/notebookStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import Button from '@/components/Button';

// Define the props for the NotebookToggler component.
interface NotebookTogglerProps {
  // bookKey: A unique identifier for the current book.
  bookKey: string;
}

// NotebookToggler component: A button to toggle the visibility of the notebook sidebar.
const NotebookToggler: React.FC<NotebookTogglerProps> = ({ bookKey }) => {
  // _ : Translation function for translating text.
  const _ = useTranslation();
  // sideBarBookKey: The key of the book currently displayed in the sidebar.
  // setSideBarBookKey: Function to update the book key in the sidebar.
  const { sideBarBookKey, setSideBarBookKey } = useSidebarStore();
  // isNotebookVisible: Indicates whether the notebook is currently visible.
  // toggleNotebook: Function to toggle the visibility of the notebook.
  const { isNotebookVisible, toggleNotebook } = useNotebookStore();
  // iconSize16: Responsive size for the icon, dynamically adjusting to screen size.
  const iconSize16 = useResponsiveSize(16);

  // handleToggleSidebar: Handles the logic for toggling the sidebar.
  const handleToggleSidebar = () => {
    // If the sidebar is currently showing this book's content.
    if (sideBarBookKey === bookKey) {
      // Toggle the notebook's visibility.
      toggleNotebook();
    } else {
      // Set the sidebar to show the current book's content.
      setSideBarBookKey(bookKey);
      // If the notebook isn't currently visible, toggle it on.
      if (!isNotebookVisible) toggleNotebook();
    }
  };
  // Render the button with the appropriate icon and functionality.
  return (
    <Button
      // Determine which icon to show based on the sidebar state.
      icon={
        sideBarBookKey == bookKey && isNotebookVisible ? (
          <LuNotebookPen size={iconSize16} className='text-base-content' />
        ) : (
          <LuNotebookPen size={iconSize16} className='text-base-content' />
        )
      }
      // Handle the click event to toggle the sidebar.
      onClick={handleToggleSidebar}
      tooltip={_('Notebook')}
      tooltipDirection='bottom'
    ></Button>
  );
};

export default NotebookToggler;
