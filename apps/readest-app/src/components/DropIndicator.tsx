import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { HiArrowDownTray } from 'react-icons/hi2';
/**
 * DropIndicator Component
 *
 * This component provides a visual indicator for the user when they are in the process
 * of dragging and dropping files (specifically, books in this application context).
 * It displays an overlay and a drop zone area, prompting the user to drop the files.
 */
const DropIndicator: React.FC = () => {
  // useTranslation hook to handle translations.
  const _ = useTranslation();

  return (
    <>
      {/* drag-overlay: This is a transparent overlay that covers the entire screen when a drag operation is active */}
      <div className='drag-overlay'></div>
      {/* drop-indicator: This is the visible area that prompts users to drop their files */}
      <div className='drop-indicator'>
        <div className='flex flex-col items-center justify-center'>
          {/* HiArrowDownTray: Visual icon indicating the drop action */}
          <HiArrowDownTray className='h-12 w-12' />
          <p className='mt-2 font-medium'>{_('Drop to Import Books')}</p>
        </div>
      </div>
    </>
  );
};

export default DropIndicator;
