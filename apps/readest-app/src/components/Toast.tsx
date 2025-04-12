import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import { eventDispatcher } from '@/utils/event';
/**
 * Represents the possible types of a toast notification.
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error';

/**
 * Toast component for displaying temporary messages to the user.
 */
export const Toast = () => {
  // State to store the message to be displayed in the toast.
  const [toastMessage, setToastMessage] = useState('');
  // Ref to store the type of the toast (info, success, warning, error).
  const toastType = useRef<ToastType>('info');
  // Ref to store the duration (in milliseconds) the toast will be displayed.
  const toastTimeout = useRef(5000);
  // Ref to store custom CSS class names for the message.
  const messageClass = useRef('');
  // Ref to store the timeout ID for dismissing the toast automatically.
  const toastDismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mapping of toast types to their corresponding CSS classes for positioning.
  const toastClassMap = {
    info: 'toast-info toast-center toast-middle',
    success: 'toast-success toast-top toast-end',
    warning: 'toast-warning toast-top toast-end',
    error: 'toast-error toast-top toast-end',
  };
  // Mapping of alert types to their corresponding CSS classes for styling.
  const alertClassMap = {
    info: 'alert-primary',
    success: 'alert-success',
    warning: 'alert-warning',
    error: 'alert-error',
  };
  /**
   * useEffect hook for managing the toast's visibility timeout.
   * Sets a timeout to clear the toast message after a specified duration.
   */
  useEffect(() => {
    // Clear any existing timeout.
    if (toastDismissTimeout.current) clearTimeout(toastDismissTimeout.current);
    // Set a new timeout to clear the toast message.
    toastDismissTimeout.current = setTimeout(() => setToastMessage(''), toastTimeout.current);

    // Cleanup function to clear the timeout when the component unmounts or the effect is re-run.
    return () => {
      if (toastDismissTimeout.current) clearTimeout(toastDismissTimeout.current);
    };
  }, [toastMessage]);

  /**
   * Event handler for displaying a toast.
   * @param event - Custom event carrying toast details.
   */
  const handleShowToast = async (event: CustomEvent) => {
    // Extract message, type, timeout, and className from the event detail.
    const { message, type = 'info', timeout, className = '' } = event.detail;
    // Set the toast message to the extracted message.
    setToastMessage(message);
    // Set the toast type.
    toastType.current = type;
    // Update the timeout if provided.
    if (timeout) toastTimeout.current = timeout;
    // Store the custom class name.
    messageClass.current = className;
  };
  /**
   * useEffect hook for subscribing to and unsubscribing from the 'toast' event.
   */
  useEffect(() => {
    eventDispatcher.on('toast', handleShowToast);
    return () => {
      eventDispatcher.off('toast', handleShowToast);
    };
  }, []);

  /**
   * Render the toast only if there is a message to display.
   */
  return (
    toastMessage && (
      <div
        // Base classes for the toast container.
        className={clsx(
          'toast toast-center toast-middle z-50 w-auto max-w-screen-sm',
          toastClassMap[toastType.current],
          toastClassMap[toastType.current].includes('toast-top') &&
            'pt-[calc(44px+env(safe-area-inset-top))]',
        )}
      > {/* Toast message container.*/}
        <div
          className={clsx(
            'alert flex max-w-80 items-center justify-center border-0',
            alertClassMap[toastType.current],
          )}
        >
          <span
            className={clsx(
              'max-h-[50vh] min-w-32 max-w-80',
              'overflow-y-auto whitespace-normal break-words text-center',
              messageClass.current,
            )}
          >
            {/* Split the message by newline and map each line to a separate element for formatting. */}
            {toastMessage.split('\n').map((line, idx) => (
              <React.Fragment key={idx}>
                {line || <>&nbsp;</>}
                <br />
              </React.Fragment>
            ))}
          </span>
        </div>
      </div>
    )
  );
};
