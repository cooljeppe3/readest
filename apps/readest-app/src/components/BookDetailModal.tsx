// Import necessary modules and components.
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

// Import custom types, utilities, and components.
import { Book } from '@/types/book';
import { BookDoc } from '@/libs/document';
import { useEnv } from '@/context/EnvContext';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useLibraryStore } from '@/store/libraryStore';

// Import utility functions for formatting book metadata.
import {
  formatAuthors,
  formatDate,
  formatLanguage,
  formatPublisher,
  formatSubject,
  formatTitle
} from '@/utils/book';
// Import components for UI elements.
import Alert from '@/components/Alert';
import Spinner from './Spinner';
import Dialog from './Dialog';

// Define the properties interface for the BookDetailModal component.
interface BookDetailModalProps {
  /**
   * The book object containing the metadata.
   */
  book: Book;
  /**
   * Determines if the modal is open or not.
   */
  isOpen: boolean;
  /**
   * Function to call when the modal is closed.
   */
  onClose: () => void;
}

const BookDetailModal = ({ book, isOpen, onClose }: BookDetailModalProps) => {
  const _ = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // State to hold the detailed metadata of the book.
  const [bookMeta, setBookMeta] = useState<BookDoc['metadata'] | null>(null);
  const { envConfig, appService } = useEnv();
  const { settings } = useSettingsStore();
  const { updateBook } = useLibraryStore();

  // useEffect hook to fetch book details when the component mounts or the book prop changes.
  useEffect(() => {
    // Timeout to set loading state after a delay.
    const loadingTimeout = setTimeout(() => setLoading(true), 300);
    
    // Async function to fetch detailed book information.
    const fetchBookDetails = async () => {
      // Get the app service instance from the environment configuration.
      const appService = await envConfig.getAppService();
      try {
        // Fetch detailed book information using the app service.
        const details = await appService.fetchBookDetails(book, settings);

        // Set the fetched metadata to state.
        setBookMeta(details);
      } finally {
        // Clear the timeout and set loading state to false.
        if (loadingTimeout) clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };

    // Execute the function to retrieve book details.
    fetchBookDetails();

    /**
     *  eslint-disable-next-line react-hooks/exhaustive-deps
     * 
     * This disables the warning that the `book` dependency should be included in the
     * array.
     * Adding `book` to the dependencies array causes an infinite loop.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  const handleClose = () => {
    setBookMeta(null);
    onClose();
  };

  // Function to handle the start of the book deletion process.
  const handleDelete = () => {
    setShowDeleteAlert(true);
  };

  // Async function to confirm and execute the book deletion.
  const confirmDelete = async () => {
    await appService?.deleteBook(book, !!book.uploadedAt);
    // Update book list.
    await updateBook(envConfig, book);
    handleClose();
    setShowDeleteAlert(false);
  };

  if (!bookMeta)
    return (
      loading && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <Spinner loading />
        </div>
      )
    );

  // Render the book details modal.
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <Dialog
        title={_('Book Details')}
        isOpen={isOpen}
        onClose={handleClose}
        bgClassName='sm:bg-black/50'
        boxClassName='sm:min-w-[480px] sm:h-auto'
        contentClassName='!px-6 !py-2'
      >
        {/* Main container for the book details */}
        <div className='flex w-full select-text items-center justify-center'>
          <div className='relative w-full rounded-lg'>
            {/* Container for book cover and title-author */}
            <div className='mb-10 flex h-40 items-start'>
              {/* Container for book cover image */}
              <div className='book-cover relative mr-10 aspect-[28/41] h-40 items-end shadow-lg'>
                {/* Book cover image */}
                <Image
                  src={book.coverImageUrl!}
                  alt={formatTitle(book.title)}
                  fill={true}
                  className='w-10 object-cover'
                  onError={(e) => {
                    // Hide the image if it fails to load.
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove(
                      'invisible',
                    );
                  }}
                />
                {/* Display book title if the image fails to load */}
                <div
                  className={clsx(
                    'invisible absolute inset-0 flex items-center justify-center p-1',
                    'text-neutral-content rounded-none text-center font-serif text-base font-medium',
                  )}
                >
                  {formatTitle(book.title)}
                </div>
              </div>

              {/* Container for book title, author, and buttons */}
              <div className='title-author flex h-40 flex-col justify-between'>
                <div>
                  <p className='text-base-content mb-2 line-clamp-2 break-all text-2xl font-bold'>
                    {formatTitle(book.title) || _('Untitled')}
                  </p>
                  <p className='text-neutral-content line-clamp-1'>
                    {formatAuthors(book.author, bookMeta.language) || _('Unknown')}
                  </p>
                </div>
                {/* Buttons for 'Delete' and 'More Info' (visible on larger screens) */}
                {window.innerWidth >= 400 && (
                  <div className='flex flex-wrap items-center gap-x-4 gap-y-2 py-2'>
                    <button
                      className='btn rounded-xl bg-red-600 px-4 text-white hover:bg-red-700'
                      onClick={handleDelete}
                    >
                      {_('Delete')}
                    </button>
                    <button className='btn btn-disabled bg-primary/25 hover:bg-primary/85 rounded-xl px-4 text-white'>
                      {_('More Info')}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Buttons for 'Delete' and 'More Info' (visible on smaller screens) */}

            {window.innerWidth < 400 && (
              <div className='flex flex-wrap items-center gap-x-4 gap-y-2 py-2'>
                <button
                  className='btn rounded bg-red-600 text-white hover:bg-red-700'
                  onClick={handleDelete}
                >
                  {_('Delete')}
                </button>
                <button className='btn btn-disabled bg-primary/25 hover:bg-primary/85 rounded px-4 text-white'>
                  {_('More Info')}
                </button>
              </div>
            )}

            {/* Book metadata details */}
            <div className='text-base-content my-4'>
              {/* Grid layout for book details */}
              <div className='mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3'>
                <div className='overflow-hidden'>
                  <span className='font-bold'>{_('Publisher:')}</span>
                  <p className='text-neutral-content line-clamp-1 text-sm'>
                    {formatPublisher(bookMeta.publisher || '') || _('Unknown')}
                  </p>
                </div>
                <div className='overflow-hidden'>
                  <span className='font-bold'>{_('Published:')}</span>
                  <p className='text-neutral-content max-w-28 text-ellipsis text-sm'>
                    {formatDate(bookMeta.published) || _('Unknown')}
                  </p>
                </div>
                <div className='overflow-hidden'>
                  <span className='font-bold'>{_('Updated:')}</span>
                  <p className='text-neutral-content text-sm'>
                    {formatDate(book.lastUpdated) || ''}
                  </p>
                </div>

                <div className='overflow-hidden'>
                  <span className='font-bold'>{_('Language:')}</span>
                  <p className='text-neutral-content text-sm'>
                    {formatLanguage(bookMeta.language) || _('Unknown')}
                  </p>
                </div>
                <div className='overflow-hidden'>
                  <span className='font-bold'>{_('Identifier:')}</span>
                  <p className='text-neutral-content line-clamp-1 text-sm'>
                    {bookMeta.identifier || 'N/A'}
                  </p>
                </div>
                <div className='overflow-hidden'>
                  <span className='font-bold'>{_('Subjects:')}</span>
                  <p className='text-neutral-content line-clamp-1 text-sm'>
                    {formatSubject(bookMeta.subject) || _('Unknown')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      {/* Conditional rendering of the delete confirmation alert */}
      {showDeleteAlert && (
        <div
          className={clsx(
            'fixed bottom-0 left-0 right-0 z-50 flex justify-center',
            'pb-[calc(env(safe-area-inset-bottom)+16px)]',
          )}
        
          // Alert to confirm if the user wants to delete the book.
        >
          <Alert
            title={_('Confirm Deletion')}
            message={_('Are you sure to delete the selected books?')}
            onCancel={() => {
              setShowDeleteAlert(false);
            }}
            onConfirm={confirmDelete}
          />
        </div>
      )}
    </div>
  );
};

// Export the BookDetailModal component as the default export.
export default BookDetailModal;
