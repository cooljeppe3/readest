import clsx from 'clsx';
import { MdCheckCircle, MdCheckCircleOutline } from 'react-icons/md';
import { CiCircleMore } from 'react-icons/ci';
import {
  LiaCloudUploadAltSolid,
  LiaCloudDownloadAltSolid,
} from 'react-icons/lia';

import { Book } from '@/types/book';
import { useEnv } from '@/context/EnvContext';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import ReadingProgress from './ReadingProgress';
import BookCover from './BookCover'; // Import the BookCover component

// Define the props for the BookItem component
interface BookItemProps {
  book: Book; // The book object to display
  isSelectMode: boolean; // Flag indicating if the library is in select mode
  selectedBooks: string[]; // Array of book hashes that are currently selected
  transferProgress: number | null; // Progress of a book transfer (upload/download) or null if no transfer is in progress
  handleBookUpload: (book: Book) => void; // Callback function to handle book upload
  handleBookDownload: (book: Book) => void; // Callback function to handle book download
  showBookDetailsModal: (book: Book) => void; // Callback function to show the book details modal
}

// BookItem component: Renders a single book item in the library
const BookItem: React.FC<BookItemProps> = ({
  book,
  isSelectMode,
  selectedBooks,
  transferProgress,
  handleBookUpload, // Function to upload a book
  handleBookDownload, // Function to download a book
  showBookDetailsModal, // Function to display the book details modal
}) => {
  // Custom hook to get responsive sizes, here it gets the icon size for 15
  const iconSize15 = useResponsiveSize(15);

  // Accessing environment variables and services through the EnvContext
  const { appService } = useEnv();

  const stopEvent = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Main container for the book item
  return (
    <div
      className={clsx(
        'book-item flex h-full flex-col',
        appService?.hasContextMenu ? 'cursor-pointer' : '' // Add cursor-pointer if context menu is available
      )}
    >
      {/* Container for the book cover image */}

      {/* Book cover image with aspect ratio and overflow hidden */}
      <div className='bg-base-100 relative flex aspect-[28/41] items-center justify-center overflow-hidden shadow-md'>
        <BookCover book={book} />
        {selectedBooks.includes(book.hash) && (
          <div className='absolute inset-0 bg-black opacity-30 transition-opacity duration-300'></div>
        )}
        {isSelectMode && (
          <div className='absolute bottom-1 right-1'>
            {selectedBooks.includes(book.hash) ? (
              <MdCheckCircle className='fill-blue-500' />
            ) : (
              <MdCheckCircleOutline className='fill-gray-300 drop-shadow-sm' />
            )}
          </div>
        )}
      </div>
      {/* Container for book information and controls */}
      <div className={clsx('flex w-full flex-col p-0 pt-2')}>
        <div className='min-w-0 flex-1'>
          {/* Book title */}
          <h4 className='block overflow-hidden text-ellipsis whitespace-nowrap text-[0.6em] text-xs font-semibold'>
            {book.title}
          </h4>
        </div>
        {/* Container for reading progress and action buttons */}
        <div
          className={clsx('flex items-center', book.progress ? 'justify-between' : 'justify-end')}
        >
          {/* Display reading progress if available */}

          {book.progress && <ReadingProgress book={book} />}
          <div className='flex items-center gap-x-1'>
            {transferProgress !== null ? (
              transferProgress === 100 ? null : (
                <div
                  className='radial-progress opacity-0 group-hover:opacity-100'
                  style={
                    {
                      '--value': transferProgress,
                      '--size': `${iconSize15}px`,
                      '--thickness': '2px',
                    } as React.CSSProperties
                  }
                  role='progressbar'
                ></div>
              )
            ) : (
              <button
                className='show-detail-button opacity-0 group-hover:opacity-100'
                onPointerDown={(e) => stopEvent(e)}
                onPointerUp={(e) => stopEvent(e)}
                onPointerMove={(e) => stopEvent(e)}
                onPointerCancel={(e) => stopEvent(e)}
                onPointerLeave={(e) => stopEvent(e)}
                onClick={() => {
                  if (!book.uploadedAt) {
                    handleBookUpload(book);
                  } else if (!book.downloadedAt) {
                    handleBookDownload(book);
                  }
                }}
              >
                {/* Show upload icon if not uploaded */}
                {!book.uploadedAt && <LiaCloudUploadAltSolid size={iconSize15} />}
                {/* Show download icon if uploaded but not downloaded */}
                {book.uploadedAt && !book.downloadedAt && (
                  <LiaCloudDownloadAltSolid size={iconSize15} />
                )}
              </button>
            )}
            {/* Button to show book details modal */}
            <button
              className='show-detail-button opacity-0 group-hover:opacity-100'
              onPointerDown={(e) => stopEvent(e)}
              onPointerUp={(e) => stopEvent(e)}
              onPointerMove={(e) => stopEvent(e)}
              onPointerCancel={(e) => stopEvent(e)}
              onPointerLeave={(e) => stopEvent(e)}
              onClick={() => showBookDetailsModal(book)}
            >
              <CiCircleMore size={iconSize15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// Export the BookItem component
export default BookItem;

