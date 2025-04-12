// Import necessary hooks and components
import { useTranslation } from '@/hooks/useTranslation';
import MenuItem from '@/components/MenuItem';

// Define the properties interface for the ImportMenu component
interface ImportMenuProps {
  // Optional callback to manage the dropdown's open/close state
  setIsDropdownOpen?: (open: boolean) => void;
  // Callback to handle the import books action
  onImportBooks: () => void;
}

// Define the functional component ImportMenu
const ImportMenu: React.FC<ImportMenuProps> = ({ setIsDropdownOpen, onImportBooks }) => {
  // Initialize the translation hook for internationalization
  const _ = useTranslation();

  // Define the handler for importing books
  const handleImportBooks = () => {
    // Call the onImportBooks callback provided via props
    onImportBooks();
    // Optionally close the dropdown menu after the action
    setIsDropdownOpen?.(false);
  };

  // Render the component's UI
  return (
    // Define the unordered list that serves as the dropdown content
    <ul
      // Set tabIndex to -1 to prevent the list from being focusable by tabbing
      tabIndex={-1}
      // Apply Tailwind CSS classes for styling
      className='dropdown-content dropdown-center bg-base-100 menu rounded-box z-[1] mt-3 w-52 p-2 shadow'
    >
      {/* 
        Render a MenuItem for the 'From Local File' option.
        The label is translated using the translation hook, and the onClick event is handled by handleImportBooks.
      */}
      <MenuItem label={_('From Local File')} onClick={handleImportBooks} />
    </ul>
  );
};

// Export the ImportMenu component as the default export
export default ImportMenu;
