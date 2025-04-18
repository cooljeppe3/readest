import clsx from 'clsx';
import React, { ReactNode, useEffect } from 'react';
import { MdArrowBackIosNew } from 'react-icons/md';
import { useEnv } from '@/context/EnvContext';
import { useDrag } from '@/hooks/useDrag';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { impactFeedback } from '@tauri-apps/plugin-haptics';
// Threshold for drag velocity to trigger a close action
const VELOCITY_THRESHOLD = 0.5;
// Threshold for snapping to a certain height
const SNAP_THRESHOLD = 0.2;

/**
 * Dialog component props interface.
 */
interface DialogProps {
  id?: string;
  isOpen: boolean;
  children: ReactNode;
  snapHeight?: number;
  header?: ReactNode;
  title?: string;
  className?: string;
  bgClassName?: string;
  boxClassName?: string;
  contentClassName?: string;
  onClose: () => void;
}

/**
 * Dialog component: A modal dialog that can be dragged to close on mobile.
 * This component is designed to be a versatile dialog with customizable content and behavior.
 */
const Dialog: React.FC<DialogProps> = ({
  id,
  isOpen,
  children,
  snapHeight,
  header,
  title,
  className,
  bgClassName,
  boxClassName,
  contentClassName,
  onClose,
}) => {
  const { appService } = useEnv();
  // State to determine if the dialog should be full height in mobile
  const [isFullHeightInMobile, setIsFullHeightInMobile] = React.useState(!snapHeight);
  // Responsive icon size
  const iconSize22 = useResponsiveSize(22);
  // Check if it's mobile device
  const isMobile = window.innerWidth < 640;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { // Close dialog on Escape key
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragMove = (data: { clientY: number; deltaY: number }) => {
    // Only handle drag on mobile
    if (!isMobile) return;
    // Get modal and overlay element
    const modal = document.querySelector('.modal-box') as HTMLElement;
    const overlay = document.querySelector('.overlay') as HTMLElement;

    // Calculate height fraction for smooth animation
    const heightFraction = data.clientY / window.innerHeight;
    // Adjust new top based on drag data
    const newTop = Math.max(0.0, Math.min(1, heightFraction));

    // Update modal styles based on drag data
    if (modal && overlay) {
      modal.style.height = '100%';
      modal.style.transform = `translateY(${newTop * 100}%)`;
      overlay.style.opacity = `${1 - heightFraction}`;

      setIsFullHeightInMobile(data.clientY < 44);
      modal.style.transition = `padding-top 0.3s ease-out`;
    }
  };

  const handleDragEnd = (data: { velocity: number; clientY: number }) => {
    // Get modal and overlay element
    const modal = document.querySelector('.modal-box') as HTMLElement;
    const overlay = document.querySelector('.overlay') as HTMLElement;
    // Return if no modal or overlay element
    if (!modal || !overlay) return;

    // Calculate upper and lower snap points
    const snapUpper = snapHeight ? 1 - snapHeight - SNAP_THRESHOLD : 0.5;
    const snapLower = snapHeight ? 1 - snapHeight + SNAP_THRESHOLD : 0.5;
    // Handle dragging down to close
    if (
      data.velocity > VELOCITY_THRESHOLD ||
      (data.velocity >= 0 && data.clientY >= window.innerHeight * snapLower)
    ) {
      const transitionDuration = 0.15 / Math.max(data.velocity, 0.5);
      modal.style.height = '100%';
      modal.style.transition = `transform ${transitionDuration}s ease-out`;
      modal.style.transform = 'translateY(100%)';
      overlay.style.transition = `opacity ${transitionDuration}s ease-out`;
      // Update overlay opacity to 0
      overlay.style.opacity = '0';
      setTimeout(() => {
        onClose();
        modal.style.transform = 'translateY(0%)';
      }, 300);
      if (appService?.hasHaptics) {
        impactFeedback('medium');
      }
      // Handle snapping to snap height
    } else if (
      snapHeight &&
      data.clientY > window.innerHeight * snapUpper &&
      data.clientY < window.innerHeight * snapLower
    ) {
      modal.style.transition = `transform 0.3s ease-out`;
      modal.style.transform = `translateY(${(1 - snapHeight) * window.innerHeight}px)`;
      setTimeout(() => {
        modal.style.height = `${snapHeight * 100}%`;
      }, 100);
      if (appService?.hasHaptics) {
        impactFeedback('medium');
      }
    // Reset to full height
    } else {
      setIsFullHeightInMobile(true);
      modal.style.height = '100%';
      modal.style.transition = `transform 0.3s ease-out`;
      modal.style.transform = `translateY(0%)`;
      overlay.style.opacity = '0';
      if (appService?.hasHaptics) {
        impactFeedback('medium');
      }
    }
  };

  // Start dragging handler
  const { handleDragStart } = useDrag(handleDragMove, handleDragEnd);

  return (
    <dialog
      // Set dialog id
      id={id ?? 'dialog'}
      // Set dialog open status
      open={isOpen}
      className={clsx(
        'modal sm:min-w-90 z-50 h-full w-full !items-start !bg-transparent sm:w-full sm:!items-center',
        className,
      )}
    >
      <div
      // Overlay style
        className={clsx('overlay fixed inset-0 z-10 bg-black/50 sm:bg-black/20', bgClassName)}
        onClick={onClose}
      />
      <div
      // Main box style
        className={clsx(
          'modal-box settings-content z-20 flex flex-col rounded-none rounded-tl-2xl rounded-tr-2xl p-0 sm:rounded-2xl',
          'h-full max-h-full w-full max-w-full',
          window.innerWidth < window.innerHeight
            ? 'sm:h-[50%] sm:w-3/4'
            : 'sm:h-[65%] sm:w-1/2 sm:max-w-[600px]',
          appService?.hasSafeAreaInset &&
            isFullHeightInMobile &&
            'pt-[env(safe-area-inset-top)] sm:pt-0',
          boxClassName,
        )}
        // Snapped height style
        style={
          snapHeight
            ? {
                height: `${snapHeight * 100}%`,
                transform: `translateY(${(1 - snapHeight) * window.innerHeight}px)`,
              }
            : {}
        }
      >
        {/* Only show drag handle in mobile device */}
        {window.innerWidth < 640 && (
          <div
            className='drag-handle flex h-10 max-h-10 min-h-10 w-full cursor-row-resize items-center justify-center'
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className='bg-base-content/50 h-1 w-10 rounded-full'></div>
          </div>
        )}
        {/* Header style */}
        <div className='dialog-header bg-base-100 sticky top-1 z-10 flex items-center justify-between px-4'>
          {header ? (
            header
          ) : (
            <div className='flex h-11 w-full items-center justify-between'>
              <button
                tabIndex={-1}
                onClick={onClose}
                className={
                  'btn btn-ghost btn-circle flex h-6 min-h-6 w-6 hover:bg-transparent focus:outline-none sm:hidden'
                }
              >
                <MdArrowBackIosNew size={iconSize22} />
              </button>
              <div className='z-15 pointer-events-none absolute inset-0 flex h-11 items-center justify-center'>
                <span className='line-clamp-1 text-center font-bold'>{title ?? ''}</span>
              </div>
              <button
                tabIndex={-1}
                onClick={onClose}
                className={
                  'bg-base-300/65 btn btn-ghost btn-circle ml-auto hidden h-6 min-h-6 w-6 focus:outline-none sm:flex'
                }
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  // Close icon
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
          )}
        </div>
        {/* Content style */}
        <div
          className={clsx(
            'text-base-content my-2 flex-grow overflow-y-auto px-6 sm:px-[10%]',
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </dialog>
  );
};

export default Dialog;
