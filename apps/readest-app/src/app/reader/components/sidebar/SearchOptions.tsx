// Import necessary modules and components
import clsx from 'clsx';
import React from 'react';
import { MdCheck } from 'react-icons/md';
import { BookSearchConfig } from '@/types/book';
import { useTranslation } from '@/hooks/useTranslation';
import { useDefaultIconSize } from '@/hooks/useResponsiveSize';
// Define the properties for the SearchOptions component
interface SearchOptionsProps {
  // The current search configuration
  searchConfig: BookSearchConfig;
  // Optional CSS class name for the menu container
  menuClassName?: string;
  // Callback function to update the search configuration
  onSearchConfigChanged: (searchConfig: BookSearchConfig) => void;
  // Optional callback function to control the dropdown's open/close state
  setIsDropdownOpen?: (isOpen: boolean) => void;
}

interface OptionProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// Define the Option component, which represents a single option in the search menu
const Option: React.FC<OptionProps> = ({ label, isActive, onClick }) => (
  <button
    className='hover:bg-base-300 flex w-full items-center justify-between rounded-md p-2'
    onClick={onClick}
  >
    <div className='flex items-center'>
      <span style={{ minWidth: `${useDefaultIconSize()}px` }}>
        {isActive && <MdCheck className='text-base-content' />}
      </span>
      <span className='ml-2'>{label}</span>
    </div>
  </button>
);

// Define the SearchOptions component, which displays the search options menu
const SearchOptions: React.FC<SearchOptionsProps> = ({
  searchConfig,
  menuClassName,
  onSearchConfigChanged,
  setIsDropdownOpen,
}) => {
  // Get the translation function from the useTranslation hook
  const _ = useTranslation();
  // Function to update the search configuration and close the dropdown
  const updateConfig = (key: keyof BookSearchConfig, value: boolean | string) => {
    // Update the search configuration with the new value
    onSearchConfigChanged({ ...searchConfig, [key]: value });
    // Close the dropdown if setIsDropdownOpen is provided
    setIsDropdownOpen?.(false);
  };

  return (
    <div
      tabIndex={0}
      className={clsx(
        // CSS classes for the dropdown menu
        'book-menu dropdown-content dropdown-center border-base-200 z-20 w-56 border shadow-2xl',
        menuClassName,
      )}
    >
      <Option
        label={_('Book')}
        isActive={searchConfig.scope === 'book'}
        onClick={() => updateConfig('scope', 'book')}
      />
      {/* Option to search within chapters */}
      <Option
        label={_('Chapter')}
        isActive={searchConfig.scope === 'section'}
        onClick={() => updateConfig('scope', 'section')}
      />
      <hr className='border-base-200 my-1' />
      <Option
        // Option to enable case-sensitive matching
        label={_('Match Case')}
        isActive={searchConfig.matchCase}
        onClick={() => updateConfig('matchCase', !searchConfig.matchCase)}
      />
      <Option
        // Option to enable whole word matching
        label={_('Match Whole Words')}
        isActive={searchConfig.matchWholeWords}
        onClick={() => updateConfig('matchWholeWords', !searchConfig.matchWholeWords)}
      />
      <Option
        label={_('Match Diacritics')}
        isActive={searchConfig.matchDiacritics}
        onClick={() => updateConfig('matchDiacritics', !searchConfig.matchDiacritics)}
      />
    </div>
  );
};

export default SearchOptions;
