import clsx from 'clsx';
import React from 'react';

/**
 * SectionInfoProps interface defines the properties for the SectionInfo component.
 * @interface SectionInfoProps
 */
interface SectionInfoProps {
  section?: string; // The section title to display.
  showDoubleBorder: boolean; // Whether to show a double border on the section indicator.
  isScrolled: boolean; // Whether the reader is scrolled (used for conditional styling).
  isVertical: boolean; // Whether the layout is vertical (for vertical reading mode).
  horizontalGap: number; // Horizontal gap percentage used for positioning.
  verticalMargin: number; // Vertical margin in pixels used for positioning.
}

/**
 * SectionInfo component is responsible for displaying the current section title in the reader view.
 * It dynamically adjusts its position and styling based on the reading mode and scrolling state.
 * @param {SectionInfoProps} props - The props for the SectionInfo component.
 * @returns {JSX.Element} The rendered SectionInfo component.
 */
const SectionInfo: React.FC<SectionInfoProps> = ({
  section, // The section title to display.
  showDoubleBorder, // Whether to show a double border on the section indicator.
  isScrolled, // Whether the reader is scrolled (used for conditional styling).
  isVertical, // Whether the layout is vertical (for vertical reading mode).
  horizontalGap, // Horizontal gap percentage used for positioning.
  verticalMargin, // Vertical margin in pixels used for positioning.
}) => {
  return (
    <div
      // Base styles for the section info container.
      className={clsx(
        'sectioninfo absolute flex items-center overflow-hidden',
        // Adjusts styles for vertical mode.
        isVertical ? 'writing-vertical-rl max-h-[85%]' : 'top-0 h-[44px]',
        // If the page is scrolled and not in vertical mode, add a background color.
        isScrolled && !isVertical && 'bg-base-100',
      )}
      // Dynamic styles to adjust the positioning based on reading mode and layout parameters.
      style={
        // Styles for vertical reading mode.
        isVertical
          ? {
              top: `${verticalMargin * 1.5}px`,
              left: `calc(100% - ${horizontalGap}%)`,
              width: showDoubleBorder ? '32px' : `${horizontalGap}%`,
              height: `calc(100% - ${verticalMargin * 2}px)`,
            }
          // Styles for horizontal reading mode.
          : { insetInlineStart: `${horizontalGap}%`, width: `calc(100% - ${horizontalGap * 2}%)` }
      }
    >
      {/* Section title display. */}
      <h2
        // Base styles for the section title.
        className={clsx(
          'text-neutral-content text-center font-sans text-xs font-light',
          // In horizontal mode, limit the title to one line.
          isVertical ? '' : 'line-clamp-1',
        )}
      >
        {section || ''}
      </h2>
    </div>
  );
};

export default SectionInfo;
