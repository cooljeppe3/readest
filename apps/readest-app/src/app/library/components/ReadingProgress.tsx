import type React from 'react';
import { memo, useMemo } from 'react';
import type { Book } from '@/types/book';
/**
 * Interface for the ReadingProgress component props.
 */
interface ReadingProgressProps {
  /**
   * The book object containing the reading progress data.
   */
  book: Book;
}

/**
 * Calculates the reading progress percentage for a given book.
 *
 * @param book - The book object.
 * @returns The progress percentage (0-100) or null if progress data is missing.
 */
const getProgressPercentage = (book: Book) => {
  // Check if progress data is available. If not, return null.
  if (!book.progress || !book.progress[1]) {
    return null;
  }
  // Check if the book is completed (progress[1] represents the total pages/sections).
  if (book.progress && book.progress[1] === 1) {
    return 100;
  }
  // Calculate the progress percentage based on the current progress (progress[0]) and total.
  const percentage = Math.round((book.progress[0] / book.progress[1]) * 100);
  // Ensure the percentage is within the valid range of 0 to 100.
  return Math.max(0, Math.min(100, percentage));
};

/**
 * Renders the reading progress bar and percentage for a book.
 */
const ReadingProgress: React.FC<ReadingProgressProps> = memo(
  ({ book }) => {
    // Calculate the progress percentage and memoize it based on the book data.
    const progressPercentage = useMemo(() => getProgressPercentage(book), [book]);
    // If progress data is not available, return null (nothing to render).
    if (progressPercentage === null) {
      return null;
    }
    // Render the progress percentage.
    return (
      <div className='text-neutral-content/70 flex justify-between text-xs'>
        <span>{progressPercentage}%</span>
      </div>
    );
  },
  // Memoization equality check function to prevent unnecessary re-renders.
  (prevProps, nextProps) => {
    return (
      prevProps.book.hash === nextProps.book.hash &&
      prevProps.book.updatedAt === nextProps.book.updatedAt
    );
  },
);
/**
 * Set a display name for react dev tools.
 */
ReadingProgress.displayName = 'ReadingProgress';

export default ReadingProgress;
