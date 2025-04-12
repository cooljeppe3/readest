// Import necessary React hooks and components.
import React from 'react';
// Import the check icon from react-icons.
import { MdCheck } from 'react-icons/md';
// Import the settings store for managing application settings.
import { useSettingsStore } from '@/store/settingsStore';
// Import the translation hook for localization.
import { useTranslation } from '@/hooks/useTranslation';
// Import the hook for responsive icon sizing.
import { useDefaultIconSize } from '@/hooks/useResponsiveSize';

// Define the props interface for the DialogMenu component.
interface DialogMenuProps {
  // An optional callback function to toggle the dropdown menu.
  toggleDropdown?: () => void;
}

// Define the DialogMenu functional component.
const DialogMenu: React.FC<DialogMenuProps> = ({ toggleDropdown }) => {
  // Get the translation function from the useTranslation hook.
  const _ = useTranslation();
  // Get the default icon size using the useDefaultIconSize hook.
  const iconSize = useDefaultIconSize();
  // Destructure the settings and the function to set global font layout settings from the settings store.
  const { isFontLayoutSettingsGlobal, setFontLayoutSettingsGlobal } = useSettingsStore();

  // Define a handler for toggling the global font layout settings.
  const handleToggleGlobal = () => {
    // Toggle the isFontLayoutSettingsGlobal flag in the settings store.
    setFontLayoutSettingsGlobal(!isFontLayoutSettingsGlobal);
    // Call the toggleDropdown function if provided.
    toggleDropdown?.();
  };

  // Render the DialogMenu component.
  return (
    // Container for the dropdown content.
    <div
      tabIndex={0}
      className='dropdown-content dropdown-right no-triangle border-base-200 z-20 mt-1 border shadow-2xl'
    >
      {/* Button for toggling the global font layout settings. */}
      <button
        className='hover:bg-base-200 text-base-content flex w-full items-center justify-between rounded-md p-2'
        onClick={handleToggleGlobal}
      >
        {/* Container for the check icon and text. */}
        <div className='flex items-center'>
          <span style={{ minWidth: `${iconSize}px` }}>
            {isFontLayoutSettingsGlobal && <MdCheck className='text-base-content' />}
          </span>
          <div
            className='lg:tooltip'
            data-tip={
              // Set the tooltip text based on the isFontLayoutSettingsGlobal value.
              isFontLayoutSettingsGlobal ? _('Apply to All Books') : _('Apply to This Book')
            }
          >
            {/* Display the text 'Global Settings' using the translation function. */}
            <span className='ml-2 whitespace-nowrap'>{_('Global Settings')}</span>
          </div>
        </div>
      </button>
    </div>
  );
};
// Export the DialogMenu component.
export default DialogMenu;
