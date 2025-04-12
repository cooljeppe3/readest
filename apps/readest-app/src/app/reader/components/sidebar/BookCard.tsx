import clsx from 'clsx';
import React from 'react';
import Image from 'next/image';
import { MdInfoOutline } from 'react-icons/md';
import { Book } from '@/types/book';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from '@/hooks/useTranslation';
import { eventDispatcher } from '@/utils/event';
import { useResponsiveSize } from '@/hooks/useResponsiveSize'; // Hook for responsive sizing of elements
import { formatAuthors, formatTitle } from '@/utils/book';

// BookCard component displays a book's cover, title, author, and a button for more info.
const BookCard = ({ book }: { book: Book }) => {
  // Extract book details from props.
  const { coverImageUrl, title, author } = book; 

  // Access the translation function from the useTranslation hook.
  const _ = useTranslation(); 

  // Retrieve the current dark mode status from the theme store.
  const { isDarkMode } = useThemeStore(); 

  // Determine the icon size based on screen responsiveness.
  const iconSize18 = useResponsiveSize(18); 

  // Function to dispatch an event to show more details about the book.
  const showBookDetails = () => {
    eventDispatcher.dispatchSync('show-book-details', book); // Dispatch event with book data.
  };

  return (
    <div className='flex h-20 w-full items-center'>
      {/* Book cover image */}
      <Image
        src={coverImageUrl!} // Source URL for the book cover image
        alt={_('Book Cover')} // Alt text for accessibility
        width={56} // Fixed width of the image
        height={80} // Fixed height of the image
        // Apply classes for layout and styling of the image.
        className={clsx(
          'me-4 aspect-auto max-h-16 w-[15%] max-w-12 rounded-sm object-cover shadow-md',
          // Apply different blend modes based on dark mode status.
          isDarkMode ? 'mix-blend-screen' : 'mix-blend-multiply', 
        )}
        // Handle image loading errors, hiding the image if it fails to load.
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      {/* Container for book title and author */}
      <div className='min-w-0 flex-1'>
        {/* Book title, formatted and truncated to two lines */}
        <h4 className='line-clamp-2 w-[90%] text-sm font-semibold'>{formatTitle(title)}</h4> 
        {/* Book author, formatted and truncated, with smaller text size and reduced opacity */}
        <p className='truncate text-xs opacity-75'>{formatAuthors(author)}</p> 
      </div>
      {/* Button to trigger book details modal */}
      <button
        className='btn btn-ghost hover:bg-base-300 h-6 min-h-6 w-6 rounded-full p-0 transition-colors'
        aria-label={_('More Info')}
      >
        <MdInfoOutline size={iconSize18} className='fill-base-content' onClick={showBookDetails} />
      </button>
    </div>
  );
};

export default BookCard;
