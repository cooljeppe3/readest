import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import { eventDispatcher } from '@/utils/event';
/**
 * Interface for the props of the SectionInfo component.
 * @interface SectionInfoProps
 * @property {string} bookKey - The unique key of the book.
 * @property {boolean} showDoubleBorder - Flag indicating whether to show a double border.
 * @property {boolean} isVertical - Flag indicating whether the layout is vertical.
 * @property {number} horizontalGap - The horizontal gap between elements.
 * @property {number} verticalMargin - The vertical margin of the component.
 */
interface SectionInfoProps {
  bookKey: string;
  showDoubleBorder: boolean;
  isVertical: boolean;
  horizontalGap: number;
  verticalMargin: number;
}  
/**
 * HintInfo component displays a temporary message to the user.
 *
 * @param {SectionInfoProps} props - The properties for the HintInfo component.
 * @returns {JSX.Element} The rendered HintInfo component.
 */
const HintInfo: React.FC<SectionInfoProps> = ({
  bookKey,
  showDoubleBorder,
  isVertical,
  horizontalGap,
  verticalMargin,
}) => {
  // State to hold the hint message to be displayed.
  const [hintMessage, setHintMessage] = React.useState<string | null>(null);
  // Ref to store the timeout duration for the hint message.
  const hintTimeout = useRef(2000);
  // Ref to store the timeout ID for dismissing the hint message.
  const dismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Handles the 'hint' event, updates the hint message and timeout duration.
   * @param {CustomEvent} event - The custom event containing hint details.
   */
  const handleShowHint = (event: CustomEvent) => {
    // Extract message, bookKey, and optional timeout from event detail.
    const { message, bookKey: hintBookKey, timeout = 2000 } = event.detail;
    // If the hint is not for the current book, do nothing.
    if (hintBookKey !== bookKey) return;
    // Update the hint message and timeout.
    setHintMessage(message);
    hintTimeout.current = timeout;
  };

  useEffect(() => {
    // Subscribe to the 'hint' event when the component mounts.
    eventDispatcher.on('hint', handleShowHint);
    // Unsubscribe from the 'hint' event when the component unmounts.
    return () => {
      eventDispatcher.off('hint', handleShowHint);
    };
  }, []);

  useEffect(() => {
    if (dismissTimeout.current) clearTimeout(dismissTimeout.current);
    dismissTimeout.current = setTimeout(() => setHintMessage(''), hintTimeout.current);
    return () => {
      if (dismissTimeout.current) clearTimeout(dismissTimeout.current);
    };
  }, [hintMessage]);

  return (
    // Main container for the hint information.
    <div
      className={clsx(
        // Positioning and styling classes.
        'hintinfo absolute flex items-center justify-end overflow-hidden',
        // Toggle background based on whether there is a message.
        hintMessage ? 'bg-base-100' : 'bg-transparent',
        // Toggle text direction and height based on layout orientation.
        isVertical ? 'writing-vertical-rl max-h-[50%]' : 'top-0 h-[44px] max-w-[50%]',
      )}
      style={
        isVertical
          ? {
              bottom: `${verticalMargin * 1.5}px`,
              left: `calc(100% - ${horizontalGap}%)`,
              width: showDoubleBorder ? '30px' : `${horizontalGap}%`,
            }
          : { insetInlineEnd: `${horizontalGap}%` }
      }
    >
      {/* Display the current hint message. */}
      <h2 className={clsx('text-neutral-content text-center font-sans text-xs font-light')}>
        {hintMessage || ''}
      </h2>
    </div>
  );
};

export default HintInfo;
