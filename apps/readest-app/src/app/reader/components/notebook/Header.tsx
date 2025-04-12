// Import necessary modules and components from external libraries and local files.
import clsx from 'clsx';
import React from 'react';

import { FiSearch } from 'react-icons/fi';
import { LuNotebookPen } from 'react-icons/lu';
import { MdArrowBackIosNew, MdOutlinePushPin, MdPushPin } from 'react-icons/md';

// Import custom hooks for translation and responsive sizing.
import { useTranslation } from '@/hooks/useTranslation';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';

// Define the props interface for the NotebookHeader component.
const NotebookHeader: React.FC<{
  isPinned: boolean; // Indicates if the notebook is pinned.
  handleClose: () => void; // Function to handle closing the notebook.
  handleTogglePin: () => void; // Function to handle toggling the pin state of the notebook.
}> = ({ isPinned, handleClose, handleTogglePin }) => {
  // Initialize the translation hook.
  const _ = useTranslation();
  // Initialize the responsive size hook to get an icon size that adapts to the screen size.
  const iconSize14 = useResponsiveSize(14);
  return (
    // Main container for the notebook header, styled with Tailwind CSS.
    <div className='notebook-header relative flex h-11 items-center px-3' dir='ltr'>
      {/* Container for the notebook title and icon, centered horizontally and vertically. */}
      <div className='absolute inset-0 flex items-center justify-center space-x-2'>
        {/* Notebook icon. */}
        <LuNotebookPen />
        {/* Notebook title, hidden on small screens. */}
        <div className='notebook-title hidden text-sm font-medium sm:flex'>{_('Notebook')}</div>
      </div>
      {/* Container for the interactive elements (pin button, close button, search button). */}
      <div className='z-10 flex items-center gap-x-4'>
        {/* Pin/Unpin button. */}
        <button
          // Callback for toggling the pin state.
          onClick={handleTogglePin}
          // Styling for the button, dynamically changing the background color based on the pinned state.
          className={clsx(
            // Base styling for the button.
            'btn btn-ghost btn-circle hidden h-6 min-h-6 w-6 sm:flex',
            isPinned ? 'bg-base-300' : 'bg-base-300/65',
          )}
        >
          {isPinned ? <MdPushPin size={iconSize14} /> : <MdOutlinePushPin size={iconSize14} />}
        </button>
        <button
          // Callback for closing the notebook.
          onClick={handleClose}
          // Styling for the close button, hidden on large screens.
          className={'btn btn-ghost btn-circle flex h-6 min-h-6 w-6 hover:bg-transparent sm:hidden'}
        >
          <MdArrowBackIosNew />
        </button>
        {/* Search button. */}
        <button className='btn btn-ghost left-0 h-8 min-h-8 w-8 p-0'>
          {/* Search icon. */}
          <FiSearch />
        </button>
      </div>
    </div>
  );
};
// Export the NotebookHeader component as default.
export default NotebookHeader;
