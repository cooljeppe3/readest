import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import { useEnv } from '@/context/EnvContext';
import { tauriHandleMinimize, tauriHandleToggleMaximize, tauriHandleClose } from '@/utils/window';
import { isTauriAppPlatform } from '@/services/environment';

/**
 * Props for the WindowButtons component, which controls the window minimize, maximize, and close buttons.
 */
interface WindowButtonsProps {
  className?: string; // Additional CSS classes for the component.
  headerRef?: React.RefObject<HTMLDivElement>; // Reference to the header element for dragging.
  showMinimize?: boolean; // Whether to show the minimize button.
  showMaximize?: boolean; // Whether to show the maximize/restore button.
  showClose?: boolean; // Whether to show the close button.
  onMinimize?: () => void; // Callback for custom minimize behavior.
  onToggleMaximize?: () => void; // Callback for custom maximize/restore behavior.
  onClose?: () => void; // Callback for custom close behavior.
}

/**
 * Props for the individual WindowButton components.
 */
interface WindowButtonProps {
  id: string; // Unique ID for the button.
  onClick: () => void; // Click handler for the button.
  ariaLabel: string; // Accessible label for the button.
  children: React.ReactNode; // Content inside the button, typically an SVG icon.
}

/**
 * Individual button component for window controls.
 */
const WindowButton: React.FC<WindowButtonProps> = ({ onClick, ariaLabel, id, children }) => (
  <button
    id={id}
    onClick={onClick}
    className='window-button text-base-content/85 hover:text-base-content'
    aria-label={ariaLabel}
  >
    {children}
  </button>
);

/**
 * WindowButtons component: Manages the minimize, maximize/restore, and close buttons for the application window.
 */
const WindowButtons: React.FC<WindowButtonsProps> = ({
  className,
  headerRef,
  showMinimize = true,
  showMaximize = true,
  showClose = true,
  onMinimize,
  onToggleMaximize,
  onClose,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { appService } = useEnv(); // Access the application service from the environment context.

  /**
   * Handles the mousedown event on the header.
   * Allows the window to be dragged and toggled (maximized/restored) by double-clicking.
   * @param e - The MouseEvent.
   * @returns void
   */
  const handleMouseDown = async (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    if (
      target.closest('.btn') ||
      target.closest('.window-button') ||
      target.closest('.dropdown-container') ||
      target.closest('.exclude-title-bar-mousedown')
    ) {
      return;
    }

    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    if (e.buttons === 1) {
      // check if it's a double click or a drag
      if (e.detail === 2) {
        getCurrentWindow().toggleMaximize();
      } else {
        getCurrentWindow().startDragging();
      }
    }
  };

  /**
   * Effect to add/remove the mousedown event listener for dragging the window.
   * Only runs if the app is a Tauri app.
   */
  useEffect(() => {
    if (!isTauriAppPlatform()) return;
    const headerElement = headerRef?.current;
    headerElement?.addEventListener('mousedown', handleMouseDown);

    return () => {
      headerElement?.removeEventListener('mousedown', handleMouseDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handles the minimize action.
   * Either uses a custom callback or the default Tauri minimize function.
   */
  const handleMinimize = async () => {
    if (onMinimize) {
      onMinimize();
    } else {
      tauriHandleMinimize();
    }
  };

  /**
   * Handles the maximize/restore action.
   */

  const handleMaximize = async () => {
    if (onToggleMaximize) {
      onToggleMaximize();
    } else {
      tauriHandleToggleMaximize();
    }
  };

  /**
   * Handles the close action.
   * Either uses a custom callback or the default Tauri close function.
   */
  const handleClose = async () => {
    if (onClose) {
      onClose();
    } else {
      tauriHandleClose();
    }
  };

  /**
   * Render the WindowButtons component.
   */
  return (
    <div
      ref={parentRef}
      className={clsx(
        'window-buttons flex h-8 items-center justify-end space-x-2',
        showClose || showMaximize || showMinimize ? 'visible' : 'hidden',
        className,
      )}
    >
      {/* Minimize Button */}
      {showMinimize && appService?.hasWindowBar && (
        <WindowButton onClick={handleMinimize} ariaLabel='Minimize' id='titlebar-minimize'>
          <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
            <path fill='currentColor' d='M20 14H4v-2h16' />
          </svg>
        </WindowButton>
      )}

      {/* Maximize/Restore Button */}
      {showMaximize && appService?.hasWindowBar && (
        <WindowButton onClick={handleMaximize} ariaLabel='Maximize/Restore' id='titlebar-maximize'>
          <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
            <path fill='currentColor' d='M4 4h16v16H4zm2 4v10h12V8z' />
          </svg>
        </WindowButton>
      )}

      {/* Close Button */}
      {showClose && (appService?.hasWindowBar || onClose) && (
        <WindowButton onClick={handleClose} ariaLabel='Close' id='titlebar-close'>
          <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'>
            <path
              fill='currentColor'
              d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z'
            />
          </svg>
        </WindowButton>
      )}
    </div>
  );
};

export default WindowButtons;
