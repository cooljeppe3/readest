import clsx from 'clsx';
import React, { useEffect } from 'react';

// Import necessary stores and hooks from the application.
import { useSettingsStore } from '@/store/settingsStore';
import { useBookDataStore } from '@/store/bookDataStore';
import { useReaderStore } from '@/store/readerStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useNotebookStore } from '@/store/notebookStore';
import { useTranslation } from '@/hooks/useTranslation';

import { useThemeStore } from '@/store/themeStore';
import { useEnv } from '@/context/EnvContext';
import { useDrag } from '@/hooks/useDrag';

// Import utility functions and types.
import { TextSelection } from '@/utils/sel';
import { BookNote } from '@/types/book';
import { uniqueId } from '@/utils/misc';
import { eventDispatcher } from '@/utils/event';
import { getBookDirFromLanguage } from '@/utils/book';

// Import child components.
import BooknoteItem from '../sidebar/BooknoteItem';
import NotebookHeader from './Header';
import NoteEditor from './NoteEditor';

// Define constants for the minimum and maximum width of the notebook.
const MIN_NOTEBOOK_WIDTH = 0.15;
const MAX_NOTEBOOK_WIDTH = 0.45;

// Define the main Notebook component.
const Notebook: React.FC = ({}) => {
  // Use custom hooks for translation, theme management, environment configuration, and managing various stores.
  const _ = useTranslation();
  const { updateAppTheme } = useThemeStore();
  const { envConfig, appService } = useEnv();
  const { settings } = useSettingsStore();
  const { sideBarBookKey } = useSidebarStore();
  const {
    notebookWidth,
    isNotebookVisible,
    isNotebookPinned,
    setNotebookWidth,
    setNotebookVisible,
    toggleNotebookPin,
    setNotebookNewAnnotation,
    setNotebookEditAnnotation,
  } = useNotebookStore();

  const { notebookNewAnnotation, notebookEditAnnotation, setNotebookPin } = useNotebookStore();

  const { getBookData, getConfig, saveConfig, updateBooknotes } = useBookDataStore();
  const { getView, getViewSettings } = useReaderStore();
  const { setNotebookWidth, setNotebookVisible, toggleNotebookPin } = useNotebookStore();
  const { setNotebookNewAnnotation, setNotebookEditAnnotation } = useNotebookStore();

  const onNavigateEvent = async () => {
    const pinButton = document.querySelector('.sidebar-pin-btn');
    const isPinButtonHidden = !pinButton || window.getComputedStyle(pinButton).display === 'none';
    if (isPinButtonHidden) {
      setNotebookVisible(false);
    }
  };

  // useEffect hook to update the application theme based on notebook visibility.
  useEffect(() => {
    if (isNotebookVisible) {
      updateAppTheme('base-200');
    } else {
      updateAppTheme('base-100');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotebookVisible]);

  // useEffect hook to initialize notebook settings and handle navigation events.
  useEffect(() => {
    setNotebookWidth(settings.globalReadSettings.notebookWidth);
    setNotebookPin(settings.globalReadSettings.isNotebookPinned);
    setNotebookVisible(settings.globalReadSettings.isNotebookPinned);

    eventDispatcher.on('navigate', onNavigateEvent);
    return () => {
      eventDispatcher.off('navigate', onNavigateEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to handle resizing the notebook.
  const handleNotebookResize = (newWidth: string) => {
    setNotebookWidth(newWidth);
    settings.globalReadSettings.notebookWidth = newWidth;
  };

  // Function to handle toggling the pinned state of the notebook.
  const handleTogglePin = () => {
    toggleNotebookPin();
    settings.globalReadSettings.isNotebookPinned = !isNotebookPinned;
  };

  // Function to handle clicks on the overlay to hide the notebook.
  const handleClickOverlay = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setNotebookVisible(false);
    // Clear the new and edit annotation when the notebook is closed
    setNotebookNewAnnotation(null);
    setNotebookEditAnnotation(null);
  };

  // Function to save a new note to the book.
  const handleSaveNote = (selection: TextSelection, note: string) => {
    if (!sideBarBookKey) return;
    const view = getView(sideBarBookKey);
    const config = getConfig(sideBarBookKey)!;

    const cfi = view?.getCFI(selection.index, selection.range);
    if (!cfi) return;

    const { booknotes: annotations = [] } = config;
    const annotation: BookNote = {
      id: uniqueId(),
      type: 'annotation',
      cfi,
      note,
      text: selection.text,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    annotations.push(annotation);
    const updatedConfig = updateBooknotes(sideBarBookKey, annotations);
    if (updatedConfig) {
      saveConfig(envConfig, sideBarBookKey, updatedConfig, settings);
    }
    setNotebookNewAnnotation(null);
  };

  // Function to edit an existing note or delete a note.
  const handleEditNote = (note: BookNote, isDelete: boolean) => {
    if (!sideBarBookKey) return;
    const config = getConfig(sideBarBookKey)!;
    const { booknotes: annotations = [] } = config;
    const existingIndex = annotations.findIndex((item) => item.id === note.id);
    if (existingIndex === -1) return;
    if (isDelete) {
      note.deletedAt = Date.now();
    } else {
      note.updatedAt = Date.now();
    }
    annotations[existingIndex] = note;
    const updatedConfig = updateBooknotes(sideBarBookKey, annotations);
    if (updatedConfig) {
      saveConfig(envConfig, sideBarBookKey, updatedConfig, settings);
    }
    setNotebookEditAnnotation(null);
  };

  // Function to handle the movement of the drag bar for notebook resizing.
  const onDragMove = (data: { clientX: number }) => {
    const widthFraction = 1 - data.clientX / window.innerWidth;
    const newWidth = Math.max(MIN_NOTEBOOK_WIDTH, Math.min(MAX_NOTEBOOK_WIDTH, widthFraction));
    handleNotebookResize(`${Math.round(newWidth * 10000) / 100}%`);
  };

  // Use the custom useDrag hook to handle the drag start event.
  const { handleDragStart } = useDrag(onDragMove);

  // If there's no book key, return null.
  if (!sideBarBookKey) return null;

  // Retrieve book data and view settings based on the sideBarBookKey.
  const bookData = getBookData(sideBarBookKey);
  const viewSettings = getViewSettings(sideBarBookKey);
  if (!bookData || !bookData.bookDoc) {
    // If book data or book document is not available, return null.
    return null;
  }
  const { bookDoc } = bookData;
  const languageDir = getBookDirFromLanguage(bookDoc.metadata.language);

  const config = getConfig(sideBarBookKey);
  const { booknotes: allNotes = [] } = config || {};
  // Filter and sort the notes for annotations.
  const annotationNotes = allNotes
    .filter((note) => note.type === 'annotation' && note.note && !note.deletedAt)
    .sort((a, b) => b.createdAt - a.createdAt);
  // Filter and sort the notes for excerpts.
  const excerptNotes = allNotes
    .filter((note) => note.type === 'excerpt' && note.text && !note.deletedAt)
    .sort((a, b) => a.createdAt - b.createdAt);

  // Return the JSX for the Notebook component if it's visible.
  // Render the notebook container and its content.
  return isNotebookVisible ? (
    <>
      {!isNotebookPinned && (
        <div className='overlay fixed inset-0 z-10 bg-black/20' onClick={handleClickOverlay} />
      )}
      <div
        className={clsx(
          'notebook-container bg-base-200 right-0 z-20 min-w-60 select-none',
          'font-sans text-base font-normal sm:text-sm',
          appService?.isIOSApp ? 'h-[100vh]' : 'h-full',
          appService?.hasSafeAreaInset && 'pt-[env(safe-area-inset-top)]',
          appService?.hasRoundedWindow && 'rounded-window-top-right rounded-window-bottom-right',
          !isNotebookPinned && 'shadow-2xl',
        )}
        dir={viewSettings?.rtl && languageDir === 'rtl' ? 'rtl' : 'ltr'}
        style={{
          width: `${notebookWidth}`,
          maxWidth: `${MAX_NOTEBOOK_WIDTH * 100}%`,
          position: isNotebookPinned ? 'relative' : 'absolute',
        }}
      >
        {/* Styles for responsiveness on smaller screens */}
        <style jsx>{`
          @media (max-width: 640px) {
            .notebook-container {
              width: 100%;
              min-width: 100%;
              max-width: 100%;

            }
          }
        `}</style>
        <div
          className='drag-bar absolute left-0 top-0 h-full w-0.5 cursor-col-resize'
          onMouseDown={handleDragStart}
        />
        <NotebookHeader
          isPinned={isNotebookPinned}
          handleClose={() => setNotebookVisible(false)}
          handleTogglePin={handleTogglePin}
        />
        <div className='max-h-[calc(100vh-44px)] overflow-y-auto px-3'>
          <div dir='ltr'>
            {excerptNotes.length > 0 && (
              <p className='content font-size-base pt-1'>{_('Excerpts')}</p>
            )}
          </div>
          <ul className=''>
            {excerptNotes.map((item, index) => (
              <li key={`${index}-${item.id}`} className='my-2'>
                <div
                  tabIndex={0}
                  className='collapse-arrow border-base-300 bg-base-100 collapse border'
                >
                  {/* Title of the excerpt */}
                  <div
                    className='collapse-title font-size-sm h-9 min-h-9 p-2 pe-8 font-medium'
                    style={
                      {
                        '--top-override': '1.2rem',
                        '--end-override': '0.7rem',
                      } as React.CSSProperties
                    }
                  >
                    <p className='line-clamp-1'>{item.text || `Excerpt ${index + 1}`}</p>
                    {/* Content of the excerpt */}
                  </div>
                  <div className='collapse-content font-size-xs select-text px-3 pb-0'>
                    <p className='hyphens-auto text-justify'>{item.text}</p>
                    <div className='flex justify-end' dir='ltr'>
                      <div
                        className='font-size-xs cursor-pointer align-bottom text-red-500 hover:text-red-600'
                        onClick={handleEditNote.bind(null, item, true)}
                      >
                        {_('Delete')}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {/* Display the "Notes" section header if there are new or existing annotation notes */}
          <div dir='ltr'>
            {(notebookNewAnnotation || annotationNotes.length > 0) && (
              <p className='content font-size-base pt-1'>{_('Notes')}</p>
            )}
          </div>

          {/* If there is a new note or a note is being edited, render the NoteEditor component */}
          {(notebookNewAnnotation || notebookEditAnnotation) && (
            <NoteEditor onSave={handleSaveNote} onEdit={(item) => handleEditNote(item, false)} />
          )}
          <ul>
            {annotationNotes.map((item, index) => (
              <BooknoteItem key={`${index}-${item.cfi}`} bookKey={sideBarBookKey} item={item} />
            ))}
          </ul>
        </div>
      </div>
    </>
  ) : null;
};

export default Notebook;
