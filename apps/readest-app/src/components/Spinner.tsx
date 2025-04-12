import clsx from 'clsx';
import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
/**
 * Spinner component displays a loading indicator.
 *
 * @param {boolean} loading - A boolean indicating whether the spinner should be displayed or not.
 */
const Spinner: React.FC<{
  loading: boolean;
}> = ({ loading }) => {
  // Access the translation function from the useTranslation hook.
  const _ = useTranslation();

  // If loading is false, don't render anything.
  if (!loading) return null;

  // Render the spinner when loading is true.
  return (
    <div
      // Use clsx to conditionally apply classes. Here, it's used for positioning.
      className={clsx(
        // Position the spinner horizontally in the center of the screen.
        'absolute left-1/2 -translate-x-1/2 transform text-center',
        // Position the spinner vertically at the top, with a dynamic offset to avoid the safe area.
        'top-4 pt-[calc(env(safe-area-inset-top)+64px)]',
      )}
      role='status'
    >
      {/* Use the loading-dots animation from DaisyUI */}
      <span className='loading loading-dots loading-lg'></span>
      {/* Accessibility text for screen readers */}
      <span className='hidden'>{_('Loading...')}</span>
    </div>
  );
};

export default Spinner;
