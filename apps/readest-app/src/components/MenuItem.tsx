import clsx from 'clsx';
import React from 'react';
import { useDefaultIconSize } from '@/hooks/useResponsiveSize';
/**
 * MenuItemProps interface defines the properties for the MenuItem component.
 * @interface MenuItemProps
 */
interface MenuItemProps {
  /** The label text to display on the menu item. */
  label: string;
  /** Optional CSS classes for styling the label text. */
  labelClass?: string;
  /** Optional keyboard shortcut to display alongside the label. */
  shortcut?: string;
  /** Indicates if the menu item is disabled. */
  disabled?: boolean;
  /** If true, the icon will not be displayed. */
  noIcon?: boolean;
  /** Optional icon to display on the menu item. */
  icon?: React.ReactNode;
  /** Optional children components (for nested menus). */
  children?: React.ReactNode;
  /** Optional callback function to execute when the menu item is clicked. */
  onClick?: () => void;
}

/**
 * MenuItem component renders a single item in a menu or submenu.
 * It can be a simple button or a nested menu item with a dropdown.
 * @component
 * @param {MenuItemProps} props - The properties for the MenuItem component.
 * @returns {React.ReactNode} The MenuItem component.
 */
const MenuItem: React.FC<MenuItemProps> = ({
  label,
  labelClass,
  shortcut,
  disabled,
  noIcon = false,
  icon, // This is the icon to be displayed in the menu item.
  children,
  onClick, // This is the function to be called when the menu item is clicked.
}) => {
  const iconSize = useDefaultIconSize();
  const menuButton = (
    <button
      className={clsx(
        'hover:bg-base-300 text-base-content flex h-10 w-full items-center justify-between rounded-md p-2',
        disabled && 'btn-disabled text-gray-400',
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {/* Container for the label and icon, ensuring proper spacing and alignment. */}
      <div className='flex min-w-0 items-center'>
        {/* Icon display logic: if `noIcon` is false, display the icon with a minimum width. */}
        {!noIcon && <span style={{ minWidth: `${iconSize}px` }}>{icon}</span>}
        {/* Label display logic: truncate the text if it's too long and apply custom class if provided. */}
        <span
          className={clsx('mx-2 flex-1 truncate text-base sm:text-sm', labelClass)}
          style={{ minWidth: 0 }}
        >
          {label} {/* The label text to be displayed. */}
        </span>
      </div>
      {/* Shortcut display logic: if a shortcut is provided, display it as a `kbd` element. */}
      {shortcut && (
        // The `kbd` element to display the shortcut.
        <kbd
          className={clsx(
            'border-base-300/40 bg-base-300/75 text-neutral-content hidden rounded-md border shadow-sm sm:flex',
            'shrink-0 px-1.5 py-0.5 text-xs font-medium',
          )}
        >
          {shortcut}
        </kbd>
      )}
    </button>
  );

  // If there are children, this is a nested menu.
  if (children) {
    return (
      // Use a `ul` to define a menu.
      <ul className='menu rounded-box m-0 p-0'>
        <li>
          {/* Details/summary tag pair for the expandable menu */}
          <details>
            {/* summary tag display menuButton content */}
            <summary className='hover:bg-base-300 p-0 pr-3'>{menuButton}</summary>
            {/* Children contain menu items that will be displayed in the sub-menu. */}
            {children}
          </details>
          {/* end details */}
        </li>
      </ul>
    );
  }
  return menuButton;
};

export default MenuItem;
