import clsx from 'clsx';
import { useRouter, useSearchParams } from 'next/navigation';
// Import utility functions for navigation
import { navigateToLibrary, navigateToReader } from '@/utils/nav';
// Import context for environment variables
import { useEnv } from '@/context/EnvContext';
// Import store for library data
import { useLibraryStore } from '@/store/libraryStore';
// Import store for settings data
import { useSettingsStore } from '@/store/settingsStore';
// Import hook for translations
import { useTranslation } from '@/hooks/useTranslation';
// Import hook for handling long press gestures
import { useLongPress } from '@/hooks/useLongPress';
// Import components for context menus
import { Menu, MenuItem } from '@tauri-apps/api/menu';
// Import function for revealing file in directory
import { revealItemInDir } from '@tauri-apps/plugin-opener';
// Import utility function for getting the OS platform
import { getOSPlatform } from '@/utils/misc';
// Import utility function for getting local book filename
import { getLocalBookFilename } from '@/utils/book';
// Import constants for ungrouped book handling
import { BOOK_UNGROUPED_ID, BOOK_UNGROUPED_NAME } from '@/services/constants';
// Import constants for file reveal labels
import { FILE_REVEAL_LABELS, FILE_REVEAL_PLATFORMS } from '@/utils/os';
// Import type definitions for book and book groups
import { Book, BookGroupType, BooksGroup } from '@/types/book';
// Import components for individual book and group items
import BookItem from './BookItem';
import GroupItem from './GroupItem';

// Define type for items that can be displayed on the bookshelf
export type BookshelfItem = Book | BooksGroup;

// Function to generate bookshelf items from a list of books
export const generateBookshelfItems = (books: Book[]): (Book | BooksGroup)[] => {
  // Aggregate books into groups
  const groups: BooksGroup[] = books.reduce((acc: BooksGroup[], book: Book) => {
    // Skip deleted books
    if (book.deletedAt) return acc;
    book.groupId = book.groupId || BOOK_UNGROUPED_ID;
    book.groupName = book.groupName || BOOK_UNGROUPED_NAME;
    const booksGroup = acc[acc.findIndex((group) => group.id === book.groupId)];
    if (booksGroup) {
      booksGroup.books.push(book);
      booksGroup.updatedAt = Math.max(booksGroup.updatedAt, book.updatedAt);
    } else {
      // Create a new group if it doesn't exist
      acc.push({
        id: book.groupId,
        name: book.groupName,
        books: [book],
        updatedAt: book.updatedAt,
      });
    }
    return acc;
  }, [] as BooksGroup[]);
  // Sort books within each group by update date
  groups.forEach((group) => {
    group.books.sort((a, b) => b.updatedAt - a.updatedAt);
  });
  // Separate ungrouped books from grouped books
  const ungroupedBooks: Book[] =
    groups.find((group) => group.name === BOOK_UNGROUPED_NAME)?.books || [];
  const groupedBooks: BooksGroup[] = groups.filter((group) => group.name !== BOOK_UNGROUPED_NAME);
  // Combine and sort all items by update date
  return [...ungroupedBooks, ...groupedBooks].sort((a, b) => b.updatedAt - a.updatedAt);
};
// Function to generate a list of groups from books
export const generateGroupsList = (items: Book[]): BookGroupType[] => {
  return items
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .reduce((acc: BookGroupType[], item: Book) => {
      if (item.deletedAt) return acc;
      if (
        item.groupId &&
        item.groupName &&
        item.groupId !== BOOK_UNGROUPED_ID &&
        item.groupName !== BOOK_UNGROUPED_NAME &&
        !acc.find((group) => group.id === item.groupId)
      ) {
        acc.push({ id: item.groupId, name: item.groupName });
      }
      return acc;
    }, []) as BookGroupType[];
};

// Interface for BookshelfItem component properties
interface BookshelfItemProps {
  item: BookshelfItem;
  isSelectMode: boolean;
  selectedBooks: string[];
  transferProgress: number | null;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSelection: (hash: string) => void;
  handleBookUpload: (book: Book) => Promise<boolean>;
  handleBookDownload: (book: Book) => Promise<boolean>;
  handleBookDelete: (book: Book) => Promise<boolean>;
  handleSetSelectMode: (selectMode: boolean) => void;
  handleShowDetailsBook: (book: Book) => void;
}

// BookshelfItem component to display individual books or book groups
const BookshelfItem: React.FC<BookshelfItemProps> = ({
  item,
  isSelectMode,
  selectedBooks,
  transferProgress,
  setLoading,
  toggleSelection,
  handleBookUpload,
  handleBookDownload,
  handleBookDelete,
  handleSetSelectMode,
  handleShowDetailsBook,
}) => {
  // Hook for translations
  const _ = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { envConfig, appService } = useEnv();
  const { settings } = useSettingsStore();
  // Function to update a book's metadata
  const { updateBook } = useLibraryStore();

  const showBookDetailsModal = async (book: Book) => {
    if (await makeBookAvailable(book)) {
      handleShowDetailsBook(book);
    }
  };

  // Function to make a book available locally (download if necessary)
  const makeBookAvailable = async (book: Book) => {
    // If the book is uploaded but not downloaded, handle the download process
    if (book.uploadedAt && !book.downloadedAt) {
      let available = false;
      const loadingTimeout = setTimeout(() => setLoading(true), 200); // Set loading state after a short delay
      try {
        available = await handleBookDownload(book);
        updateBook(envConfig, book);
      } finally {
        if (loadingTimeout) clearTimeout(loadingTimeout);
        setLoading(false);
        return available;
      }
    }
    return true;
  };

  // Handle click on a book item
  const handleBookClick = async (book: Book) => {
    if (isSelectMode) {
      toggleSelection(book.hash);
    } else {
      if (!(await makeBookAvailable(book))) return;
      navigateToReader(router, [book.hash]);
    }
  };

  // Handle click on a book group item
  const handleGroupClick = (group: BooksGroup) => {
    if (isSelectMode) {
      toggleSelection(group.id);
    } else {
      const params = new URLSearchParams(searchParams?.toString());
      params.set('group', group.id);
      navigateToLibrary(router, `${params.toString()}`);
    }
  };

  // Handler for book context menu
  const bookContextMenuHandler = async (book: Book) => {
    if (!appService?.hasContextMenu) return;
    const osPlatform = getOSPlatform();
    const fileRevealLabel =
    // Define label for reveal in file explorer depending on OS
      FILE_REVEAL_LABELS[osPlatform as FILE_REVEAL_PLATFORMS] || FILE_REVEAL_LABELS.default;
    const selectBookMenuItem = await MenuItem.new({
      text: selectedBooks.includes(book.hash) ? _('Deselect Book') : _('Select Book'),
      action: async () => {
        if (!isSelectMode) handleSetSelectMode(true);
        toggleSelection(book.hash);
      },
    });
    const showBookInFinderMenuItem = await MenuItem.new({
      text: _(fileRevealLabel),
      action: async () => {
        const folder = `${settings.localBooksDir}/${getLocalBookFilename(book)}`;
        revealItemInDir(folder);
      },
    });
    const showBookDetailsMenuItem = await MenuItem.new({
      text: _('Show Book Details'),
      action: async () => {
        showBookDetailsModal(book);
      },
    });
    const downloadBookMenuItem = await MenuItem.new({
      text: _('Download Book'),
      action: async () => {
        handleBookDownload(book);
      },
    });
    const uploadBookMenuItem = await MenuItem.new({
      text: _('Upload Book'),
      action: async () => {
        handleBookUpload(book);
      },
    });
    const deleteBookMenuItem = await MenuItem.new({
      text: _('Delete'),
      action: async () => {
        await handleBookDelete(book);
      },
    });
    const menu = await Menu.new();
    menu.append(selectBookMenuItem);
    menu.append(showBookDetailsMenuItem);
    menu.append(showBookInFinderMenuItem);
    if (book.uploadedAt && !book.downloadedAt) {
      menu.append(downloadBookMenuItem);
    }
    if (!book.uploadedAt && book.downloadedAt) {
      menu.append(uploadBookMenuItem);
    }
    menu.append(deleteBookMenuItem);
    menu.popup();
  };
    // Handler for group context menu

  const groupContextMenuHandler = async (group: BooksGroup) => {
    if (!appService?.hasContextMenu) return;
    const selectGroupMenuItem = await MenuItem.new({
      text: selectedBooks.includes(group.id) ? _('Deselect Group') : _('Select Group'),
      action: async () => {
        if (!isSelectMode) handleSetSelectMode(true);
        toggleSelection(group.id);
      },
    });
    const deleteGroupMenuItem = await MenuItem.new({
      text: _('Delete'),
      action: async () => {
        for (const book of group.books) {
          await handleBookDelete(book);
        }
      },
    });
    const menu = await Menu.new();
    menu.append(selectGroupMenuItem);
    menu.append(deleteGroupMenuItem);
    menu.popup();
  };

  // Hook to handle long press and context menu interactions
  const { pressing, handlers } = useLongPress({
    onLongPress: async () => {
      if (!isSelectMode) {
        handleSetSelectMode(true);
      }
      if ('format' in item) {
        toggleSelection((item as Book).hash);
      } else {
        toggleSelection((item as BooksGroup).id);
      }
    },
    onTap: () => {
      if ('format' in item) {
        handleBookClick(item as Book);
      } else {
        handleGroupClick(item as BooksGroup);
      }
    },
    onContextMenu: () => {
      if ('format' in item) {
        bookContextMenuHandler(item as Book);
      } else {
        groupContextMenuHandler(item as BooksGroup);
      }
    },
  });

  // Render the BookshelfItem
  return (
    <div
      className={clsx(
        // Apply classes for styling and hover effects
        'sm:hover:bg-base-300/50 group flex h-full flex-col px-0 py-4 sm:px-4',
        // Apply scale animation on press
        pressing ? 'scale-95' : 'scale-100',
      )}
      style={{
        transition: 'transform 0.2s', // Smooth transition for scale effect
      }}
      {...handlers}
    >
      <div className='flex-grow'>
        {'format' in item ? (
          <BookItem
            book={item}
            isSelectMode={isSelectMode}
            selectedBooks={selectedBooks}
            transferProgress={transferProgress}
            handleBookUpload={handleBookUpload}
            handleBookDownload={handleBookDownload}
            showBookDetailsModal={showBookDetailsModal}
          />
        ) : (
          <GroupItem group={item} isSelectMode={isSelectMode} selectedBooks={selectedBooks} />
        )}
      </div>
    </div>
  );
};

export default BookshelfItem;
