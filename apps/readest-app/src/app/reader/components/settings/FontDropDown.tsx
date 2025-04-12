// Import necessary libraries and components
import clsx from 'clsx';
import React from 'react';
import { FiChevronUp, FiChevronLeft } from 'react-icons/fi';
import { MdCheck } from 'react-icons/md';
import { useTranslation } from '@/hooks/useTranslation';
import { useDefaultIconSize, useResponsiveSize } from '@/hooks/useResponsiveSize';
// Define the interface for the properties of the FontDropdown component
interface DropdownProps {
  /** The font family to apply to the text. */
  family?: string;
  /** The currently selected font option. */
  selected: string;
  /** An array of font options, each with an option value and an optional label. */
  options: { option: string; label?: string }[];
  /** An optional array of more font options, used for system fonts or additional choices. */
  moreOptions?: { option: string; label?: string }[];
  /** A callback function to be executed when a font option is selected. */
  onSelect: (option: string) => void;
  /**
   * A callback function to get the font family for a given option.
   * @param option - The selected font option.
   * @param family - The base font family.
   * @returns The formatted font family string.
   */
  onGetFontFamily: (option: string, family: string) => string;
}

// Define the FontDropdown component as a functional component
const FontDropdown: React.FC<DropdownProps> = ({
  // Destructure props
  family,
  selected,
  options,
  moreOptions,
  onSelect,
  onGetFontFamily,
}) => {
  // Get the translation function from the useTranslation hook
  const _ = useTranslation();
  // Get the icon size for a size of 16 using the useResponsiveSize hook
  const iconSize16 = useResponsiveSize(16);
  // Get the default icon size using the useDefaultIconSize hook
  const defaultIconSize = useDefaultIconSize();
  // Combine the regular options and more options into a single array
  const allOptions = [...options, ...(moreOptions ?? [])];
  // Find the currently selected option or default to the first option if not found
  const selectedOption = allOptions.find((option) => option.option === selected) ?? allOptions[0]!;
  return (
    // Main container for the dropdown
    <div className='dropdown dropdown-top'>
      {/* Button to display the currently selected option and open the dropdown */}
      <button
        tabIndex={0}
        className='btn btn-sm flex items-center gap-1 px-[20px] font-normal normal-case'
        // Focus on the button when it's clicked
        onClick={(e) => e.currentTarget.focus()}
      >
        {/* Display the selected option's label with the correct font family */}
        <span style={{ fontFamily: onGetFontFamily(selectedOption.option, family ?? '') }}>
          {selectedOption.label}
        </span>
        {/* Display an upward chevron icon indicating the dropdown's state */}
        <FiChevronUp size={iconSize16} />
      </button>
      <ul
        tabIndex={0}
        className={clsx(
          'dropdown-content bgcolor-base-200 no-triangle menu rounded-box absolute right-[-32px] z-[1] mt-4 w-44 shadow sm:right-0',
          'inline max-h-80 overflow-y-scroll',
        )}
      >
        {/* Map over the regular font options and render each as a list item */}
        {options.map(({ option, label }) => (
          <li key={option} onClick={() => onSelect(option)}>
            <div className='flex items-center px-0'>
              <span style={{ minWidth: `${defaultIconSize}px` }}>
                {selected === option && <MdCheck className='text-base-content' />}
              </span>
              <span style={{ fontFamily: onGetFontFamily(option, family ?? '') }}>
                {label || option}
              </span>
            </div>
          </li>
        ))}
        {/* If there are more options, render a sub-dropdown for system fonts */}
        {moreOptions && moreOptions.length > 0 && (
          <li className='dropdown dropdown-left dropdown-top'>
            <div className='flex items-center px-0'>
              <span style={{ minWidth: `${defaultIconSize}px` }}>
                <FiChevronLeft size={iconSize16} />
              </span>
              <span>{_('System Fonts')}</span>
            </div>
            <ul
              tabIndex={0}
              className={clsx(
                'dropdown-content bgcolor-base-200 menu rounded-box relative z-[1] overflow-y-scroll shadow',
                '!mr-5 mb-[-46px] inline max-h-80 w-[200px] overflow-y-scroll',
              )}
            >
              {/* Map over the more options and render each as a list item */}
              {moreOptions.map((option, index) => (
                <li key={`${index}-${option.option}`} onClick={() => onSelect(option.option)}>
                  <div className='flex items-center px-2'>
                    <span style={{ minWidth: `${defaultIconSize}px` }}>
                      {selected === option.option && <MdCheck className='text-base-content' />}
                    </span>
                    <span style={{ fontFamily: onGetFontFamily(option.option, family ?? '') }}>
                      {option.label || option.option}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        )}
      </ul>
    </div>
  );
};
// Export the FontDropdown component
export default FontDropdown;
