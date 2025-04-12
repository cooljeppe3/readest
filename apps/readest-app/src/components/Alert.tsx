import clsx from 'clsx';
import React from 'react';
import { useTranslation } from '@/hooks/useTranslation'; // Import the translation hook for localization.

/**
 * Alert Component
 *
 * This component renders a customizable alert dialog that can be used to display messages
 * and prompt the user to take action (e.g., confirm an action or cancel).
 */
const Alert: React.FC<{
  title: string; // The title of the alert dialog.
  message: string; // The message content of the alert dialog.
  onCancel: () => void; // Callback function to execute when the "Cancel" button is clicked.
  onConfirm: () => void; // Callback function to execute when the "Confirm" button is clicked.
}> = ({ title, message, onCancel, onConfirm }) => {
  const _ = useTranslation(); // Initialize the translation hook to access translated strings.
  return (
    // Main container for the alert, centered and with padding.
    <div className={clsx('z-[100] flex justify-center px-4')}>
      {/* The alert dialog itself. */}
      <div
        role='alert'
        className={clsx(
          'alert flex items-center justify-between',
          'bg-base-300 rounded-lg border-none p-4 shadow-2xl',
          'w-full max-w-[90vw] sm:max-w-[70vw] md:max-w-[50vw] lg:max-w-[40vw] xl:max-w-[40vw]',
        )}
      >
        {/* Container for the icon and text. */}
        <div className='flex items-center space-x-2'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            className='stroke-info h-6 w-6 shrink-0'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            ></path>
          </svg>
          {/* Container for the title and message. */}
          <div className=''>
            {/* The title of the alert. */}
            <h3 className='font-sm text-base'>{title}</h3>
            {/* The message of the alert. */}
            <div className='text-xs'>{message}</div>
          </div>
        </div>
        {/* Container for the action buttons. */}
        <div className='flex flex-wrap items-center justify-center gap-2'>
          <button className='btn btn-sm' onClick={onCancel}>
            {_('Cancel')}
          </button>
          <button className='btn btn-sm btn-warning' onClick={onConfirm}>
            {_('Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert; // Export the Alert component for use in other parts of the application.

