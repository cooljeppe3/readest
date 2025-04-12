import clsx from 'clsx';
import React from 'react';
import { useEnv } from '@/context/EnvContext'; // Import the environment context hook
import { useTranslation } from '@/hooks/useTranslation'; // Import the translation hook
import { PageInfo } from '@/types/book'; // Import the PageInfo type definition

// Define the properties interface for the PageInfoView component
interface PageInfoProps {
  bookFormat: string; // The format of the book (e.g., 'PDF', 'EPUB', 'CBZ')
  section?: PageInfo; // Information about the current section of the book (for PDF/CBZ formats)
  pageinfo?: PageInfo; // Information about the current page (for other formats)
  showDoubleBorder: boolean; // Flag to indicate if a double border should be shown
  isScrolled: boolean; // Flag to indicate if the content is scrolled
  isVertical: boolean; // Flag to indicate if the view is in vertical mode
  horizontalGap: number; // The horizontal gap/margin of the page
  verticalMargin: number; // The vertical margin of the page
}

// Define the PageInfoView component
const PageInfoView: React.FC<PageInfoProps> = ({
  bookFormat, // Destructure the bookFormat prop
  section, // Destructure the section prop
  pageinfo, // Destructure the pageinfo prop
  showDoubleBorder, // Destructure the showDoubleBorder prop
  isScrolled, // Destructure the isScrolled prop
  isVertical, // Destructure the isVertical prop
  horizontalGap, // Destructure the horizontalGap prop
  verticalMargin, // Destructure the verticalMargin prop
}) => {
  const _ = useTranslation(); // Initialize the translation hook for localization
  const { appService } = useEnv(); // Initialize the environment context hook

  // Determine the page information to display based on the book format and available data
  // Different formats have different ways of representing page information
  const pageInfo = ['PDF', 'CBZ'].includes(bookFormat)
    // For PDF and CBZ, use section data (if available)
    ? section
      // If the section data exists, format the information
      ? isVertical
        // If the view is vertical, use a centered dot "·" as separator
        ? `${section.current + 1} · ${section.total}`
        // If the view is horizontal, use a slash "/" as separator
        : `${section.current + 1} / ${section.total}`
      // If no section data is available, display nothing
      : ''
    // For other formats, use pageinfo data (if available)
    : pageinfo
      // If the pageinfo exists, format the information with translation
      ? _(isVertical ? '{{currentPage}} · {{totalPage}}' : 'Loc. {{currentPage}} / {{totalPage}}', {
          currentPage: (pageinfo.next ?? pageinfo.current) + 1,
          totalPage: pageinfo.total,
        })
      : '';

  return (
    // The main container for the page information view
    <div
      className={clsx(
        // Base classes for positioning and alignment
        'pageinfo absolute bottom-0 flex items-center justify-end',
        // Add writing mode if is vertical or add height if is not
        isVertical ? 'writing-vertical-rl' : 'h-12 w-full',
        // Add background color if is scrolled and not in vertical mode
        isScrolled && !isVertical && 'bg-base-100',
      )}
      // Styles for positioning and sizing the page information
      style={
        // If the view is vertical, position it along the side
        isVertical
          ? {
              // Position at the bottom with a margin
              bottom: `${verticalMargin * 1.5}px`,
              // Adjust the left position based on double border visibility and horizontal gap
              left: showDoubleBorder ? `calc(${horizontalGap}% - 32px)` : 0,
              // Set the width based on double border visibility and horizontal gap
              width: showDoubleBorder ? '32px' : `${horizontalGap}%`,
              // Set the height based on vertical margin
              height: `calc(100% - ${verticalMargin * 2}px)`,
            }
          // If not vertical, position it horizontally
          : {
              // Position at the end with the specified horizontal gap
              insetInlineEnd: `${horizontalGap}%`,
              // Add padding if the device has a safe area inset
              paddingBottom: appService?.hasSafeAreaInset ? 'env(safe-area-inset-bottom)' : 0,
            }
      }
    >
      <h2 className='text-neutral-content text-right font-sans text-xs font-extralight'>
        {pageInfo}
      </h2>
    </div>
  );
};

// Export the PageInfoView component as the default export
export default PageInfoView;
