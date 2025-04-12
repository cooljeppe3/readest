import clsx from 'clsx';
import React, { useState } from 'react';
import { BookConfig } from '@/types/book'; // Import the BookConfig type
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { RiFontSize } from 'react-icons/ri'; // Icon for Font settings
import { RiDashboardLine } from 'react-icons/ri'; // Icon for Layout settings
import { VscSymbolColor } from 'react-icons/vsc'; // Icon for Color settings
import { PiDotsThreeVerticalBold } from 'react-icons/pi'; // Icon for more options dropdown
import { IoAccessibilityOutline } from 'react-icons/io5'; // Icon for Misc settings
import { MdArrowBackIosNew } from 'react-icons/md'; // Icon for back button

import FontPanel from './FontPanel'; // Component for font settings
import LayoutPanel from './LayoutPanel'; // Component for layout settings
import ColorPanel from './ColorPanel'; // Component for color settings
import Dropdown from '@/components/Dropdown'; // Generic dropdown component
import Dialog from '@/components/Dialog'; // Generic dialog/modal component
import DialogMenu from './DialogMenu'; // Component for the dialog menu (more options)
import MiscPanel from './MiscPanel'; // Component for miscellaneous settings

// Define the types of settings panels available in the dialog
type SettingsPanelType = 'Font' | 'Layout' | 'Color' | 'Misc'; // Type for the active panel

// Define the structure for a tab configuration
type TabConfig = {
  tab: SettingsPanelType; // The type of the settings panel
  icon: React.ElementType; // The icon component for the tab
  label: string; // The label text for the tab
};

// Main settings dialog component
const SettingsDialog: React.FC<{ bookKey: string; config: BookConfig }> = ({ bookKey }) => {
  const _ = useTranslation(); // Translation hook for localization

  // State to track the currently active panel (Font, Layout, Color, Misc)
  const [activePanel, setActivePanel] = useState<SettingsPanelType>(
    // Load the last active panel from local storage, default to 'Font'
    (localStorage.getItem('lastConfigPanel') || 'Font') as SettingsPanelType,
  );
  const { setFontLayoutSettingsDialogOpen } = useSettingsStore(); // State management to open/close the dialog

  // Configuration for each tab in the settings dialog
  const tabConfig = [
    {
      tab: 'Font', // Panel type: Font
      icon: RiFontSize, // Icon for the tab
      label: _('Font'), // Translated label for the tab
    },
    {
      tab: 'Layout', // Panel type: Layout
      icon: RiDashboardLine, // Icon for the tab
      label: _('Layout'), // Translated label for the tab
    },
    {
      tab: 'Color', // Panel type: Color
      icon: VscSymbolColor, // Icon for the tab
      label: _('Color'), // Translated label for the tab
    },
    {
      tab: 'Misc', // Panel type: Misc
      icon: IoAccessibilityOutline, // Icon for the tab
      label: _('Misc'), // Translated label for the tab
    },
  ] as TabConfig[];

  const handleSetActivePanel = (tab: SettingsPanelType) => {
    setActivePanel(tab);
    localStorage.setItem('lastConfigPanel', tab);
  };

  // Close the settings dialog
  const handleClose = () => {
    setFontLayoutSettingsDialogOpen(false);
  };

  // Render the settings dialog
  return (
    <>
      {/* Main dialog component */}
      <Dialog
        isOpen={true} // Dialog is always open
        onClose={handleClose} // Callback when the dialog is closed
        className='modal-open' // Add a class when modal is open
        boxClassName='sm:min-w-[520px]'
        snapHeight={window.innerWidth < 640 ? 0.7 : undefined}
        header={
          <div className='flex w-full items-center justify-between'>
            <button
              tabIndex={-1}
              onClick={handleClose}
              className={
                'btn btn-ghost btn-circle flex h-6 min-h-6 w-6 hover:bg-transparent focus:outline-none sm:hidden'
              }
            >
              <MdArrowBackIosNew />
            </button>
            {/* Tab navigation for different settings panels */}
            <div className='dialog-tabs flex h-10 max-w-[100%] flex-grow items-center gap-2 pl-4'>
              {tabConfig.map(({ tab, icon: Icon, label }) => (
                <button
                  key={tab}
                  className={clsx(
                    'btn btn-ghost text-base-content btn-sm',
                    activePanel === tab ? 'btn-active' : '',
                  )}
                  onClick={() => handleSetActivePanel(tab)}
                >
                  <Icon className='mr-0' />
                  {window.innerWidth >= 500 ? label : ''}
                </button>
              ))}
            </div>
            {/* More options dropdown and close button */}
            <div className='flex h-full items-center justify-end gap-x-2'>
              <Dropdown
                className='dropdown-bottom dropdown-end'
                buttonClassName='btn btn-ghost h-8 min-h-8 w-8 p-0'
                toggleButton={<PiDotsThreeVerticalBold />}
              >
                <DialogMenu />
              </Dropdown>
              <button
                onClick={handleClose}
                className={'bg-base-300/65 btn btn-ghost btn-circle hidden h-6 min-h-6 w-6 sm:flex'}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='1em'
                  height='1em'
                  viewBox='0 0 24 24'
                >
                  <path
                    fill='currentColor'
                    d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z'
                  />
                </svg>
              </button>
            </div>
          </div>
        }
      >
        {/* Render the active settings panel based on the activePanel state */}
        {activePanel === 'Font' && <FontPanel bookKey={bookKey} />}
        {activePanel === 'Layout' && <LayoutPanel bookKey={bookKey} />}
        {activePanel === 'Color' && <ColorPanel bookKey={bookKey} />}
        {activePanel === 'Misc' && <MiscPanel bookKey={bookKey} />}
        {/* End of Dialog body */}
      </Dialog>
    </>
  );
};

export default SettingsDialog;
