import clsx from 'clsx';
import * as React from 'react';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { MdDelete, MdOpenInNew, MdOutlineCancel } from 'react-icons/md';
import { LuFolderPlus } from 'react-icons/lu';
import { PiPlus } from 'react-icons/pi';
import { Book, BooksGroup } from '@/types/book'; // Importing book-related types
import { useEnv } from '@/context/EnvContext';
import { useLibraryStore } from '@/store/libraryStore';
import { useTranslation } from '@/hooks/useTranslation';
import { navigateToLibrary, navigateToReader } from '@/utils/nav';
import {
  formatAuthors,
  formatTitle,
} from '@/utils/book'; // Importing utility functions for book data
import { isMd5 } from '@/utils/md5'; // Importing md5 utility function

import Alert from '@/components/Alert'; // Importing Alert component
import Spinner from '@/components/Spinner'; // Importing Spinner component
import BookshelfItem, {
  generateBookshelfItems,
} from './BookshelfItem'; // Importing BookshelfItem component and related utility function
import GroupingModal from './GroupingModal'; // Importing GroupingModal component

// Interface for the Bookshelf component's properties
interface BookshelfProps {
  libraryBooks: Book[]; // Array of books in the library
  isSelectMode: boolean; // Flag to indicate if selection mode is active
  handleImportBooks: () => void; // Function to handle importing books
  handleBookUpload: (book: Book) => Promise<boolean>; // Function to handle uploading a book
  handleBookDownload: (book: Book) => Promise<boolean>; // Function to handle downloading a book
  handleBookDelete: (book: Book) => Promise<boolean>; // Function to handle deleting a book
  handleSetSelectMode: (
    selectMode: boolean,
  ) => void; // Function to set the select mode
  handleShowDetailsBook: (book: Book) => void; // Function to show details of a book
  booksTransferProgress: {
    [key: string]: number | null;
  }; // Object to track the transfer progress of books
}

const Bookshelf: React.FC<BookshelfProps> = ({
  libraryBooks,
  isSelectMode,
  handleImportBooks,
  handleBookUpload,
  handleBookDownload,
  handleBookDelete,
  handleSetSelectMode,
  handleShowDetailsBook,
  booksTransferProgress,
}: BookshelfProps) => {
  const _ = useTranslation(); // Hook for translations
  const router = useRouter(); // Hook for routing
  const searchParams = useSearchParams(); // Hook for getting search parameters
  const { appService } = useEnv(); // Accessing app services from environment context
  const [loading, setLoading] = useState(false); // State to track loading status
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]); // State to manage selected books
  const [
    showSelectModeActions,
    setShowSelectModeActions,
  ] = useState(false); // State to show/hide select mode actions
  const [showDeleteAlert, setShowDeleteAlert] = useState(false); // State to show/hide delete alert
  const [
    showGroupingModal,
    setShowGroupingModal,
  ] = useState(false); // State to show/hide grouping modal
  const [queryTerm, setQueryTerm] = useState<string | null>(
    null,
  ); // State to track the search query term
  const [navBooksGroup, setNavBooksGroup] = useState<BooksGroup | null>(
    null,
  ); // State to manage navigation within book groups
  const [importBookUrl] = useState(
    searchParams?.get('url') || '',
  ); // State to manage the URL for importing a book
  const isImportingBook = useRef(false); // Ref to track if a book is being imported

  const { setLibrary } = useLibraryStore(); // Accessing setLibrary function from library store
  const allBookshelfItems = generateBookshelfItems(
    libraryBooks,
  ); // Generating bookshelf items from library books

  // Effect to handle showing/hiding select mode actions
  useEffect(() => {
    if (isSelectMode) {
      setShowSelectModeActions(true);
    } else {
      setSelectedBooks([]); // Clear selected books
      setShowSelectModeActions(false); // Hide select mode actions
    }
  }, [isSelectMode]);

  // Effect to handle importing a book from a URL
  useEffect(() => {
    if (isImportingBook.current) return; // Prevent multiple imports
    isImportingBook.current = true; // Set flag to indicate import is in progress

    if (importBookUrl && appService) {
      const importBook = async () => {
        console.log('Importing book from URL:', importBookUrl);
        const book = await appService.importBook(importBookUrl, libraryBooks);
        if (book) {
          setLibrary(libraryBooks);
          appService.saveLibraryBooks(libraryBooks);
          navigateToReader(router, [book.hash]);
        }
      };
      importBook();
      isImportingBook.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importBookUrl, appService]);

  // Effect to handle changes in search parameters and library books
  useEffect(() => {
    const group = searchParams?.get('group') || ''; // Get group from search params
    const query = searchParams?.get('q') || ''; // Get query from search params
    if (query) { // If there is a query
      setQueryTerm(query); // Set the query term
    } else {
      setQueryTerm(null); // Clear the query term
    }
    if (group) { // If there is a group
      const booksGroup = allBookshelfItems.find(
        (item) => 'name' in item && item.id === group,
      ) as BooksGroup; // Find the book group
      if (booksGroup) {
        setNavBooksGroup(booksGroup); // Set the navigation book group
      } else {
        navigateToLibrary(
          router,
          query ? `q=${query}` : undefined,
        ); // Navigate to library with or without query
      }
    } else {
      setNavBooksGroup(null); // Clear the navigation book group
      navigateToLibrary(
        router,
        query ? `q=${query}` : undefined,
      ); // Navigate to library with or without query
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, libraryBooks, showGroupingModal]);

  const toggleSelection = (id: string) => {
    // Toggles the selection of a book by its id
    setSelectedBooks((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id],
    );
  };

  const openSelectedBooks = () => {
    setTimeout(() => setLoading(true), 200);
    navigateToReader(router, selectedBooks);
    // Open selected books in the reader
  };

  // Confirms the deletion of selected books
  const confirmDelete = async () => {
    // Iterate over each selected book
    selectedBooks.forEach((id) => {
      // Find books with matching hash or groupId
      for (const book of libraryBooks.filter(
        (book) => book.hash === id || book.groupId === id,
      )) {
        // If the book exists and is not already marked as deleted
        if (book && !book.deletedAt) {
          handleBookDelete(book); // Delete the book
        }
      }
    });
    setSelectedBooks([]); // Clear the selected books
    setShowDeleteAlert(false); // Hide the delete alert
    setShowSelectModeActions(true); // Show the select mode actions
  };

  const deleteSelectedBooks = () => {
    setShowSelectModeActions(false); // Hide the select mode actions
    setShowDeleteAlert(true); // Show the delete alert
  };

  const groupSelectedBooks = () => {
    setShowSelectModeActions(false); // Hide the select mode actions
    setShowGroupingModal(true); // Show the grouping modal
  };

  // Determine current bookshelf items based on navigation group
  const currentBookshelfItems = navBooksGroup
    ? navBooksGroup.books
    : allBookshelfItems;

  // Filters a book based on a query term
  const bookFilter = (item: Book, queryTerm: string) => {
    // If the item is marked as deleted, exclude it
    if (item.deletedAt) return false;

    // Create a case-insensitive regular expression from the query term
    const searchTerm = new RegExp(queryTerm, 'i');

    // Format the title and authors for matching
    const title = formatTitle(item.title);
    const authors = formatAuthors(item.author);
    return searchTerm.test(title) || searchTerm.test(authors);
  };
  const filteredBookshelfItems = currentBookshelfItems.filter((item) => {
    if ('name' in item) return item.books.some((book) => bookFilter(book, queryTerm || ''));
    else if (queryTerm) return bookFilter(item, queryTerm);
    return true;
    
  });

  return (
    <div className='bookshelf'>
      <div
        className={clsx(
          // Grid layout for bookshelf items
          'transform-wrapper grid flex-1 gap-x-4 sm:gap-x-0',
          // Responsive grid columns
          'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-12',
        )}
      >
        {/* Map over the filtered bookshelf items */}
        {filteredBookshelfItems.map((item, index) => (
          <BookshelfItem
            key={`library-item-${index}`}
            item={item}
            isSelectMode={isSelectMode}
            selectedBooks={selectedBooks}
            setLoading={setLoading}
            toggleSelection={toggleSelection}
            handleBookUpload={handleBookUpload}
            handleBookDownload={handleBookDownload}
            handleBookDelete={handleBookDelete}
            handleSetSelectMode={handleSetSelectMode}
            handleShowDetailsBook={handleShowDetailsBook}
            transferProgress={
              'hash' in item ? booksTransferProgress[(item as Book).hash] || null : null
            }
          />
        ))}
        {/* Add book button */}
        {!navBooksGroup && allBookshelfItems.length > 0 && (
          <div
            className={clsx(
              'border-1 bg-base-100 hover:bg-base-300/50 flex items-center justify-center',
              'mx-0 my-4 aspect-[28/41] sm:mx-4',
            )}
            role='button'
            onClick={handleImportBooks}
          >
            <PiPlus className='size-10' color='gray' />
          </div>
        )}
      </div>
      {/* Loading spinner */}
      {loading && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <Spinner loading /> 
          {/* Render the spinner component when loading is true */}
        </div>
      )}
      <div className='fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+16px)]'>
        {isSelectMode && showSelectModeActions && (
          <div
            className={clsx(
              'flex items-center justify-center shadow-lg',
              'text-base-content bg-base-300 text-sm',
              'mx-auto w-fit space-x-6 rounded-lg p-4',
            )}
            {/* Open Selected Books Button */}
          >
            <button
              onClick={openSelectedBooks}
              className={clsx(
                'flex flex-col items-center justify-center',
                (!selectedBooks.length || !selectedBooks.every((id) => isMd5(id))) &&
                  'btn-disabled opacity-50',
              )}
            >
              <MdOpenInNew />
              {/* Display the 'Open' text */}
              <div>{_('Open')}</div>
            </button>
            <button
              onClick={groupSelectedBooks}
              className={clsx(
                'flex flex-col items-center justify-center',
                !selectedBooks.length && 'btn-disabled opacity-50',
              )}
            >
              <LuFolderPlus />
              <div>{_('Group')}</div>
            </button>
            <button
              onClick={deleteSelectedBooks}
              className={clsx(
                'flex flex-col items-center justify-center',
                !selectedBooks.length && 'btn-disabled opacity-50',
              )}
            >
              <MdDelete className='fill-red-500' />
              <div className='text-red-500'>{_('Delete')}</div>
            </button>
            <button
              onClick={() => handleSetSelectMode(false)}
              className={clsx('flex flex-col items-center justify-center')}
            >
              <MdOutlineCancel />
              <div>{_('Cancel')}</div>
              {/* Cancel Button */}
            </button>
          </div>
        )}
      </div>
      {showGroupingModal && (
        <div>
          <GroupingModal
            libraryBooks={libraryBooks}
            selectedBooks={selectedBooks}
            onCancel={() => {
              setShowGroupingModal(false);
              setShowSelectModeActions(true);
            }}
            onConfirm={() => {
              setShowGroupingModal(false);
              handleSetSelectMode(false);
            }}
          />
        </div>
      )}
      {showDeleteAlert && (
        <div
          className={clsx(
            'fixed bottom-0 left-0 right-0 z-50 flex justify-center',
            'pb-[calc(env(safe-area-inset-bottom)+16px)]',
          )}
        >
          <Alert
            title={_('Confirm Deletion')}
            message={_('Are you sure to delete the selected books?')}
            onCancel={() => {
              setShowDeleteAlert(false);
              setShowSelectModeActions(true);
            }}
            onConfirm={confirmDelete}
          />
        </div>
      )}
    </div>
  );
};

export default Bookshelf;
