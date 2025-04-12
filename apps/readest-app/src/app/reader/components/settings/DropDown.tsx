// Import necessary modules and components.
import clsx from 'clsx';
import React from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { MdCheck } from 'react-icons/md';
import { useDefaultIconSize, useResponsiveSize } from '@/hooks/useResponsiveSize';

// Define the interface for the DropDown component's properties.
interface DropDownProps {
  // The currently selected option.
  selected: { option: string; label: string };
  // The list of available options for selection.
  options: { option: string; label: string }[];
  // Callback function triggered when an option is selected.
  onSelect: (option: string) => void;
}

// Define the DropDown functional component, which accepts DropDownProps.
const DropDown: React.FC<DropDownProps> = ({ selected, options, onSelect }) => {
  // Get the responsive size for icons (16px) using a custom hook.
  const iconSize16 = useResponsiveSize(16);
  // Get the default icon size for consistent icon width.
  const defaultIconSize = useDefaultIconSize();

  return (
    // Main container for the dropdown, using 'dropdown' and 'dropdown-bottom' for styling.
    <div className='dropdown dropdown-bottom'>
      {/* Button to trigger the dropdown, with text showing the currently selected option. */}
      <button
        tabIndex={0}
        className='btn btn-sm flex items-center gap-1 px-[20px] font-normal normal-case'
        // Focus on the button when clicked, so the dropdown menu will display.
        onClick={(e) => e.currentTarget.focus()}
      >
        <span>{selected.label}</span>
        {/* Chevron down icon to indicate dropdown functionality. */}
        <FiChevronDown size={iconSize16} />
      </button>
      {/* Dropdown menu content, hidden by default until the button is clicked. */}
      <ul
        tabIndex={0}
        className={clsx(
          'dropdown-content bgcolor-base-200 no-triangle menu rounded-box absolute z-[1] shadow',
          'menu-vertical right-[-32px] mt-2 inline max-h-80 w-44 overflow-y-scroll sm:right-0',
        )}
      >
        {/* Map over the options array to create each dropdown list item. */}
        {options.map(({ option, label }) => (
          // List item representing a single option.
          <li key={option} onClick={() => onSelect(option)}>
            {/* Flex container to align the checkbox and option label. */}
            <div className='flex items-center px-0'>
              {/* Span to hold the checkmark icon if the option is selected. */}
              <span style={{ minWidth: `${defaultIconSize}px` }}>
                {/* Checkmark icon to indicate the selected option. */}
                {selected.option === option && <MdCheck className='text-base-content' />}
              </span>
              {/* The label of the option. */}
              <span>{label || option}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Export the DropDown component.
export default DropDown;
