import clsx from 'clsx';
import React, { useState, isValidElement, ReactElement } from 'react';

/**
 * @interface DropdownProps
 * @description Interface defining the properties for the Dropdown component.
 */
interface DropdownProps {
  /** @property className - Optional CSS class name for the main dropdown container. */
  className?: string;
  /** @property menuClassName - Optional CSS class name for the dropdown menu. */
  menuClassName?: string;
  /** @property buttonClassName - Optional CSS class name for the toggle button. */
  buttonClassName?: string;
  /** @property toggleButton - The React node (e.g., button, icon) used to toggle the dropdown. */
  toggleButton: React.ReactNode;
  /** @property children - The React element representing the dropdown menu. */
  children: ReactElement<{ setIsDropdownOpen: (isOpen: boolean) => void; menuClassName?: string }>;
  /** @property onToggle - Optional callback function triggered when the dropdown is opened or closed. */
  onToggle?: (isOpen: boolean) => void;
}

/**
 * @component Dropdown
 * @description A versatile dropdown component that can be customized with various props.
 * It handles the state of the dropdown (open/closed) and provides a toggle button to control it.
 */
const Dropdown: React.FC<DropdownProps> = ({
  className,
  menuClassName,
  buttonClassName,
  toggleButton,
  children,
  onToggle, // Callback function for when the dropdown is toggled
}) => {
  /** @const isOpen - State variable to manage the visibility of the dropdown menu. */
  const [isOpen, setIsOpen] = useState(false);

  /**
   * @function toggleDropdown
   * @description Toggles the dropdown menu's visibility and calls the onToggle callback.
   */
  const toggleDropdown = () => {
    const newIsOpen = !isOpen; // Inverts the current state
    setIsOpen(newIsOpen); // Updates the state
    onToggle?.(newIsOpen); // Calls the optional onToggle callback
  };

  /**
   * @function setIsDropdownOpen
   * @description Sets the dropdown menu's visibility directly and calls the onToggle callback.
   * @param {boolean} isOpen - The new state of the dropdown (open or closed).
   */
  const setIsDropdownOpen = (isOpen: boolean) => {
    setIsOpen(isOpen); // Updates the state
    onToggle?.(isOpen); // Calls the optional onToggle callback
  };

  /**
   * @const childrenWithToggle
   * @description Clones the children element and passes down the setIsDropdownOpen function and menuClassName.
   */
  const childrenWithToggle = isValidElement(children)
    ? React.cloneElement(children, { setIsDropdownOpen, menuClassName })
    : children;

  return (
    <div className='dropdown-container'> {/* Main container for the dropdown */}
      {isOpen && (
        <div className='fixed inset-0 bg-transparent' onClick={() => setIsDropdownOpen(false)} />
      )}
      <div className={clsx('dropdown', className)}>
        <div
          tabIndex={-1}
          onClick={toggleDropdown}
          className={clsx('dropdown-toggle', buttonClassName, isOpen && 'bg-base-300/50')}
        > {/* Toggle button to show/hide the dropdown */}
          {toggleButton}
        </div>
        {isOpen && childrenWithToggle} {/* Conditionally renders the children when isOpen is true */}
      </div> {/* The dropdown menu container */}
    </div>
  );
};

export default Dropdown;
