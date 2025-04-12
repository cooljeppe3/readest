import React from 'react';
import { RiFontSize } from 'react-icons/ri';

// Import the translation hook for multi-language support.
import { useTranslation } from '@/hooks/useTranslation';
// Import the settings store to manage application settings state.
import { useSettingsStore } from '@/store/settingsStore';
// Import the Button component for creating a reusable button.
import Button from '@/components/Button';

/**
 * SettingsToggler component:
 * This component renders a button that toggles the visibility of the font and layout settings dialog.
 */
const SettingsToggler = () => {
  // Get the translation function from the useTranslation hook.
  const _ = useTranslation();
  // Get the state of the font layout settings dialog and the setter function from the settings store.
  const { isFontLayoutSettingsDialogOpen, setFontLayoutSettingsDialogOpen } = useSettingsStore();

  // Function to toggle the font and layout settings dialog.
  const handleToggleSettings = () => {
    setFontLayoutSettingsDialogOpen(!isFontLayoutSettingsDialogOpen);
  };

  // Render a Button component that displays a font size icon and toggles the settings dialog on click.
  return (
    <Button
      icon={<RiFontSize className='text-base-content' />} // Displays the font size icon.
      onClick={handleToggleSettings}
      tooltip={_('Font & Layout')} // The tooltip text, translated using the translation hook.
      tooltipDirection='bottom' // Specifies the direction of the tooltip.
    ></Button>
  );
};

export default SettingsToggler;
