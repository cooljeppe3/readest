import clsx from 'clsx';
import React from 'react';

// Import necessary context and utility functions
import { useEnv } from '@/context/EnvContext';
import { BookNote } from '@/types/book';
import { useSettingsStore } from '@/store/settingsStore';
import { useReaderStore } from '@/store/readerStore';
import { useNotebookStore } from '@/store/notebookStore';
import { useBookDataStore } from '@/store/bookDataStore';
// Custom hook for managing translations
import { useTranslation } from '@/hooks/useTranslation';
// Custom hook for scrolling to specific items in the reader view
import useScrollToItem from '../../hooks/useScrollToItem';
// Utility function for dispatching events
import { eventDispatcher } from '@/utils/event';

// Interface defining the props for the BooknoteItem component
interface BooknoteItemProps {
  // The key of the book associated with this note
  bookKey: string;
  // The book note item data
  item: BookNote;
}

// BooknoteItem component: Displays a single note in the sidebar
const BooknoteItem: React.FC<BooknoteItemProps> = ({ bookKey, item }) => {
  // Translation function for localized text
  const _ = useTranslation();
  // Environment configuration data
  const { envConfig } = useEnv();
  // Settings from the settings store
  const { settings } = useSettingsStore();
  // Functions to manage book data, such as loading, saving, and updating booknotes
  const { getConfig, saveConfig, updateBooknotes } = useBookDataStore();
  // Functions to manage the reader view, such as getting progress and view information
  const { getProgress, getView, getViewsById } = useReaderStore();
  const { setNotebookEditAnnotation, setNotebookVisible } = useNotebookStore();

  const { text, cfi, note } = item;
  const progress = getProgress(bookKey);
  const { isCurrent, viewRef } = useScrollToItem(cfi, progress);

  // Handler for clicking on a booknote item
  const handleClickItem = (event: React.MouseEvent) => {
    // Prevent the default click behavior
    event.preventDefault();
    // Dispatch a 'navigate' event to move the reader to the note's location
    eventDispatcher.dispatch('navigate', { bookKey, cfi });
    // Go to the specified CFI (location) in the reader view
    getView(bookKey)?.goTo(cfi);
    // If the note has content, show the notebook
    if (note) {
      setNotebookVisible(true);
    }
  };

  // Function to delete a note from the book
  const deleteNote = (note: BookNote) => {
    if (!bookKey) return;
    const config = getConfig(bookKey);
    if (!config) return;
    const { booknotes = [] } = config;
    booknotes.forEach((item) => {
      if (item.id === note.id) {
        // Set the deletedAt timestamp to mark it as deleted
        item.deletedAt = Date.now();
        // Retrieve the reader views associated with the book
        const views = getViewsById(bookKey.split('-')[0]!);
        // Iterate over each view and add the "deleted" annotation
        views.forEach((view) => view?.addAnnotation(item, true));
      }
    });
    // Update the booknotes in the book configuration
    const updatedConfig = updateBooknotes(bookKey, booknotes);
    // Save the updated book configuration
    if (updatedConfig) {
      saveConfig(envConfig, bookKey, updatedConfig, settings);
    }
  };

  // Function to edit an existing note
  const editNote = (note: BookNote) => {
    // Show the notebook and set the selected annotation for editing
    setNotebookVisible(true);
    setNotebookEditAnnotation(note);
  };

  return (
    <li
      ref={viewRef}
      // Conditional styling to highlight the current note
      className={clsx(
        'border-base-300 content group relative my-2 cursor-pointer rounded-lg p-2',
        isCurrent ? 'bg-base-300/85 hover:bg-base-300' : 'hover:bg-base-300/55 bg-base-100',
        'transition-all duration-300 ease-in-out',
      )}
      tabIndex={0}
      onClick={handleClickItem}
    >
      {/* The main content area for displaying the note or highlight */}
      <div
        className={clsx('min-h-4 p-0 transition-all duration-300 ease-in-out')}
        style={
          {
            '--top-override': '0.7rem',
            '--end-override': '0.3rem',
          } as React.CSSProperties
        }
      >
        {/* Display the note content if it exists */}
        {item.note && (
          <span className='content font-size-sm font-normal' dir='auto'>
            {item.note}
          </span>
        )}
        <div className='flex items-start'>
          {item.note && (
            <div className='my-1 me-2 min-h-full self-stretch border-l-2 border-gray-300'></div>
          {/* Display the text of the note or highlight */}
          )}
          <div className={clsx('content font-size-sm line-clamp-3', item.note && 'my-2')}>
            <span
              className={clsx(
                'inline',
                item.note && 'content font-size-xs text-gray-500',
                (item.style === 'underline' || item.style === 'squiggly') &&
                  'underline decoration-2',
                item.style === 'highlight' && `bg-${item.color}-500 bg-opacity-40`,
                item.style === 'underline' && `decoration-${item.color}-400`,
                item.style === 'squiggly' && `decoration-wavy decoration-${item.color}-400`,
              )}
            >
              {text || ''}
            </span>
          </div>
        </div>
      </div>
      {/* Container for edit and delete buttons, hidden by default */}
      <div
        className={clsx(
          'max-h-0 overflow-hidden p-0 text-xs',
          'transition-[max-height] duration-300 ease-in-out',
          'group-hover:max-h-8 group-hover:overflow-visible',
        )}
        style={
          {
            '--bottom-override': 0,
          } as React.CSSProperties
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Button container for editing or deleting the note */}
        <div className='flex justify-end space-x-3 p-2' dir='ltr'>
          {item.note && (
            <button
              className={clsx(
                'btn btn-ghost content settings-content hover:bg-transparent',
                'flex h-4 min-h-4 items-end p-0',
              )}
              onClick={editNote.bind(null, item)}
            >
              <div
                className={clsx(
                  'align-bottom text-blue-500',
                  'transition duration-300 ease-in-out',
                  'content font-size-sm',
                  'opacity-0 group-hover:opacity-100',
                  'hover:text-blue-600',
                )}
              >
                {_('Edit')}
              </div>
            </button>
          )}
          <button
            className={clsx(
              'btn btn-ghost content settings-content hover:bg-transparent',
              'flex h-4 min-h-4 items-end p-0',
            )}
            onClick={deleteNote.bind(null, item)}
          >
            <div
              className={clsx(
                'align-bottom text-red-500',
                'transition duration-300 ease-in-out',
                'content font-size-sm',
                'opacity-0 group-hover:opacity-100',
                'hover:text-red-600',
              )}
            >
              {_('Delete')}
            </div>
          </button>
        </div>
      </div>
    </li>
  );
};

export default BooknoteItem;
