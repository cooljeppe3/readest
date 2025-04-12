import clsx from 'clsx';
import React, { useEffect } from 'react';

// Contexts
import { useEnv } from '@/context/EnvContext';

// Stores
import { useSettingsStore } from '@/store/settingsStore';
import { useReaderStore } from '@/store/readerStore';
import { useBookDataStore } from '@/store/bookDataStore';
import { useSidebarStore } from '@/store/sidebarStore';

// Components
import FoliateViewer from './FoliateViewer';
import SectionInfo from './SectionInfo';
import HeaderBar from './HeaderBar';
import FooterBar from './FooterBar';
import PageInfoView from './PageInfo';
import Ribbon from './Ribbon';
import SettingsDialog from './settings/SettingsDialog';
import FootnotePopup from './FootnotePopup';
import HintInfo from './HintInfo';
import DoubleBorder from './DoubleBorder';
import Annotator from './annotator/Annotator';

// Utils
import getGridTemplate from '@/utils/grid';

// Props for the BooksGrid component
interface BooksGridProps {
  // Array of book keys to display
  bookKeys: string[];
  // Callback function to close a book
  onCloseBook: (bookKey: string) => void;
}

// BooksGrid component: Renders a grid of book views
const BooksGrid: React.FC<BooksGridProps> = ({ bookKeys, onCloseBook }) => {
  // Accessing environment variables
  const { appService } = useEnv();

  // Accessing data stores
  const { getConfig, getBookData } = useBookDataStore();
  const { getProgress, getViewState, getViewSettings } = useReaderStore();
  const { isSideBarVisible, sideBarBookKey } = useSidebarStore();
  const { isFontLayoutSettingsDialogOpen, setFontLayoutSettingsDialogOpen } = useSettingsStore();
  const gridTemplate = getGridTemplate(bookKeys.length, window.innerWidth / window.innerHeight);

  useEffect(() => {
    // If no book is selected in the sidebar, do nothing
    if (!sideBarBookKey) return;
    // Retrieve the book data for the selected book key
    const bookData = getBookData(sideBarBookKey);
    // If book data or book is not available, do nothing
    if (!bookData || !bookData.book) return;
    // Set the document title to the book's title
    document.title = bookData.book.title;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sideBarBookKey]);

  return (
    // Main container for the grid of books
    <div className={clsx(
        'grid h-full flex-grow', // Flex container that grows to fill the available space
        appService?.hasSafeAreaInset && 'pt-[env(safe-area-inset-top)]', // Add padding if there is a safe area inset
      )}
      style={{
        gridTemplateColumns: gridTemplate.columns,
        gridTemplateRows: gridTemplate.rows,
      }}
    >
      {bookKeys.map((bookKey, index) => {
        // Retrieve book-specific data
        const bookData = getBookData(bookKey);
        const config = getConfig(bookKey);
        const progress = getProgress(bookKey);
        const viewSettings = getViewSettings(bookKey);
        const { book, bookDoc } = bookData || {};

        // If any essential data is missing, skip this book
        if (!book || !config || !bookDoc || !viewSettings) return null;

        // Extract necessary data from the progress and view settings
        const { section, pageinfo, sectionLabel } = progress || {};

        // Check if the book is bookmarked
        const isBookmarked = getViewState(bookKey)?.ribbonVisible;

        // Calculate horizontal and vertical spacing for UI elements
        const horizontalGapPercent = viewSettings.gapPercent;
        const verticalMarginPixels = viewSettings.marginPx;

        return (
          // Container for each individual book
          // Each cell within the grid
          // Unique ID and key based on the book key
          <div
            id={`gridcell-${bookKey}`}
            key={bookKey}
            className={clsx(
              'relative h-full w-full overflow-hidden',
              !isSideBarVisible && appService?.hasRoundedWindow && 'rounded-window',
            )}
          >
            {/* Ribbon to indicate the book is bookmarked */}
            {isBookmarked && <Ribbon width={`${horizontalGapPercent}%`} />}
            {/* Header bar: Contains book title, close button, and settings button */}
            <HeaderBar

              // Props for HeaderBar
              bookKey={bookKey}
              bookTitle={book.title}
              isTopLeft={index === 0}
              isHoveredAnim={bookKeys.length > 2}
              onCloseBook={onCloseBook}
              onSetSettingsDialogOpen={setFontLayoutSettingsDialogOpen}
            />
            {/* FoliateViewer: Main component for rendering the book content */}
            <FoliateViewer bookKey={bookKey} bookDoc={bookDoc} config={config} />
            {/* Conditional rendering for vertical view with scrolling */}
            {viewSettings.vertical && viewSettings.scrolled && (
              <>
                {/* Left vertical spacer */}
                <div

                  // Styles for the vertical spacers
                  className='bg-base-100 absolute left-0 top-0 h-full'
                  style={{
                    width: `calc(${horizontalGapPercent}%)`,
                    height: `calc(100% - ${verticalMarginPixels}px)`,
                  }}
                />
                <div
                  // Styles for the vertical spacers
                  className='bg-base-100 absolute right-0 top-0 h-full'
                  style={{
                    width: `calc(${horizontalGapPercent}%)`,
                    height: `calc(100% - ${verticalMarginPixels}px)`,
                  }}
                />
              </>
            )}
            {/* Conditional rendering for vertical view with double border */}
            {viewSettings.vertical && viewSettings.doubleBorder && (
              // DoubleBorder: Borders for vertical view mode
              <DoubleBorder
                showHeader={viewSettings.showHeader}
                showFooter={viewSettings.showFooter}
                borderColor={viewSettings.borderColor}
                horizontalGap={horizontalGapPercent}
                verticalMargin={verticalMarginPixels}
              />
            )}
            {/* Section information display */}
            {viewSettings.showHeader && (
              <SectionInfo
                section={sectionLabel}
                showDoubleBorder={viewSettings.vertical && viewSettings.doubleBorder}
                isScrolled={viewSettings.scrolled}
                isVertical={viewSettings.vertical}
                horizontalGap={horizontalGapPercent}
                verticalMargin={verticalMarginPixels}
              />
            )}
            {/* HintInfo: Displays hints or contextual information */}
            <HintInfo
              bookKey={bookKey}
              showDoubleBorder={viewSettings.vertical && viewSettings.doubleBorder}
              isVertical={viewSettings.vertical}
              horizontalGap={horizontalGapPercent}
              verticalMargin={verticalMarginPixels}
            />
            {viewSettings.showFooter && (
              // Footer: Contains page info, etc.
              <PageInfoView
                bookFormat={book.format}
                section={section}
                pageinfo={pageinfo}
                showDoubleBorder={viewSettings.vertical && viewSettings.doubleBorder}
                isScrolled={viewSettings.scrolled}
                isVertical={viewSettings.vertical}
                horizontalGap={horizontalGapPercent}
                verticalMargin={verticalMarginPixels}
              />
            )}
            {/* Annotator: Component for annotations */}
            <Annotator bookKey={bookKey} />
            {/* FootnotePopup: Popup for displaying footnotes */}
            <FootnotePopup bookKey={bookKey} bookDoc={bookDoc} />
            {/* Footer bar: Contains page number and progress information */}
            <FooterBar
              bookKey={bookKey}
              bookFormat={book.format}

              // Props for FooterBar
              section={section}
              pageinfo={pageinfo}
              isHoveredAnim={false}
            />
            {isFontLayoutSettingsDialogOpen && <SettingsDialog bookKey={bookKey} config={config} />}
          </div>
        );
      })}
    </div>
  );
};

// Exporting the BooksGrid component
export default BooksGrid;
