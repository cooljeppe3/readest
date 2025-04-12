import clsx from 'clsx';
import Image from 'next/image';
// Import the Book type for type checking and interface definition
import { Book } from '@/types/book';
// Import utility functions for formatting book titles and authors
import { formatAuthors, formatTitle } from '@/utils/book';

// Define the properties expected by the BookCover component
interface BookCoverProps {
  book: Book;          // The book object containing details like title, author, and cover image URL
  isPreview?: boolean; // Optional boolean flag to indicate if this is a preview cover (e.g., in a list)
}

// Define the BookCover functional component that renders a book's cover image and text details
const BookCover: React.FC<BookCoverProps> = ({ book, isPreview }) => {
  return (
    // Main container for the book cover, using relative positioning for absolute positioning of child elements
    <div className='relative flex h-full w-full'>
      {/* Image component from Next.js for optimized image rendering */}
      <Image
        src={book.coverImageUrl!} // The URL of the book's cover image
        alt={book.title}           // The alt text for the image (book title)
        fill={true}               // Make the image fill its container
        className='object-cover'   // Ensure the image covers the entire area, preserving aspect ratio
        // Handle image loading errors
        onError={(e) => {
          // Hide the image if it fails to load
          (e.target as HTMLImageElement).style.display = 'none';
          // Remove the 'invisible' class from the next sibling element (div with book info), making it visible
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('invisible');
        }}
      />
      {/* Container for the book's title and author information, initially hidden */}
      <div
        className={clsx(
          'invisible absolute inset-0 rounded-none p-2', // Initially hidden and positioned absolutely within the parent
          'text-neutral-content text-center font-serif font-medium', // Text styling: color, alignment, font family and weight
          isPreview && 'bg-base-200/50', // If it's a preview, apply a semi-transparent background
        )}
      >
        {/* Container for the book's title */}
        <div className='flex h-1/2 items-center justify-center'>
          {/* Span to display the formatted book title */}
          <span
            className={clsx(
              isPreview ? 'line-clamp-2' : 'line-clamp-3', // Limit title to 2 lines in preview, 3 lines otherwise
              isPreview ? 'text-[0.5em]' : 'text-lg',     // Smaller text size in preview mode, larger otherwise
            )}
          >
            {/* Format and display the book's title */}
            {formatTitle(book.title)}
          </span>
        </div>
        {/* Spacer div for vertical spacing */}
        <div className='h-1/6'></div>
        {/* Container for the book's author(s) */}
        <div className='flex h-1/3 items-center justify-center'>
          {/* Span to display the formatted book author(s) */}
          <span
            className={clsx(
              'text-neutral-content/50 line-clamp-1',
              isPreview ? 'text-[0.4em]' : 'text-base',
            )}
          >
            {formatAuthors(book.author)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BookCover;
