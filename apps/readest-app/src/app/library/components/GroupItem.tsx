import clsx from 'clsx';
import { MdCheckCircle, MdCheckCircleOutline } from 'react-icons/md';

import { useEnv } from '@/context/EnvContext';
import { BooksGroup } from '@/types/book';

import BookCover from './BookCover';

// Interface for the GroupItem component's properties.
interface GroupItemProps {
  // The group of books to display.
  group: BooksGroup;
  // Indicates whether the component is in select mode.
  isSelectMode: boolean;
  // An array of IDs of the currently selected books.
  selectedBooks: string[];
}

// GroupItem component definition.
const GroupItem: React.FC<GroupItemProps> = ({ group, isSelectMode, selectedBooks }) => {
  // Accessing the environment context to use appService.
  const { appService } = useEnv();
  return (
    // Main container for a group item.
    <div
      className={clsx(
        'group-item flex h-full flex-col',
        // Conditionally add a class for cursor pointer if the app has a context menu.
        appService?.hasContextMenu ? 'cursor-pointer' : '',
      )}
    >
      {/* Container for displaying book covers. */}
      <div className='bg-base-100 relative flex aspect-[28/41] items-center justify-center overflow-hidden p-2 shadow-md'>
        {/* Grid layout for arranging up to four book covers. */}
        <div className='grid w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden'>
          {/* Mapping over the first four books in the group to display their covers. */}
          {group.books.slice(0, 4).map((book) => (
            // Using the book's hash as a unique key for each book cover.
            <div key={book.hash} className='relative aspect-[28/41] h-full w-full'>
              {/* Displaying the book cover using the BookCover component. */}
              <BookCover book={book} isPreview />
            </div>
          ))}
        </div>
        {/* Overlay for indicating that this group is selected. */}
        {selectedBooks.includes(group.id) && (
          <div className='absolute inset-0 bg-black opacity-30 transition-opacity duration-300'></div>
        )}
        {isSelectMode && (
          <div className='absolute bottom-1 right-1'>
            {selectedBooks.includes(group.id) ? (
              <MdCheckCircle className='fill-blue-500' />
            ) : (
              <MdCheckCircleOutline className='fill-gray-300 drop-shadow-sm' />
            )}
          </div>
        )}
        {/* Name of the book group */}
      </div>
      <div className='min-w-0 flex-1 pt-2'>
        {/* Displaying the group name with text overflow handling. */}
        <h4 className='block overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold'>
          {group.name}
        </h4>
      </div>
    </div>
  );
}; // End of GroupItem component.

// Exporting the GroupItem component.
export default GroupItem;
