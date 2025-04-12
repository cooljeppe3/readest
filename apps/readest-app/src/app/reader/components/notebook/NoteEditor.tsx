// Import necessary modules and components
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import { useNotebookStore } from '@/store/notebookStore';
import { useTranslation } from '@/hooks/useTranslation';
import { TextSelection } from '@/utils/sel';
import { md5Fingerprint } from '@/utils/md5';
import { BookNote } from '@/types/book'; // Import the BookNote type
import useShortcuts from '@/hooks/useShortcuts';

// Define the interface for the props of the NoteEditor component
interface NoteEditorProps {
  // Callback function to be called when a new note is saved
  onSave: (selection: TextSelection, note: string) => void;
  // Callback function to be called when an existing annotation is edited
  onEdit: (annotation: BookNote) => void;
}

// NoteEditor functional component, which renders a text area for editing notes
const NoteEditor: React.FC<NoteEditorProps> = ({ onSave, onEdit }) => {
  // Hook to get the translation function
  const _ = useTranslation();
  // Access the notebook store using the useNotebookStore hook
  const {
    // The new annotation object being created
    notebookNewAnnotation,
    // The existing annotation object being edited
    notebookEditAnnotation,
    // Function to set the notebookNewAnnotation state
    setNotebookNewAnnotation,
    // Function to set the notebookEditAnnotation state
    setNotebookEditAnnotation,
    // Function to save the draft of a notebook annotation
    saveNotebookAnnotationDraft,
    // Function to get the draft of a notebook annotation
    getNotebookAnnotationDraft,
  } = useNotebookStore();
  // Create a ref to the textarea element
  const editorRef = useRef<HTMLTextAreaElement>(null);
  // State to hold the note content
  const [note, setNote] = React.useState('');

  // useEffect hook to focus the editor when it renders
  useEffect(() => {
    // Check if the editorRef is currently available
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, [editorRef]);

  useEffect(() => {
    if (notebookEditAnnotation) {
      // If editing an existing annotation, set the note and adjust height
      setNote(notebookEditAnnotation.note);
      if (editorRef.current) {
        editorRef.current.value = notebookEditAnnotation.note;
        editorRef.current.focus();
        adjustHeight();
      }
    } else if (notebookNewAnnotation) {
      // If creating a new annotation, set the note from draft and adjust height
      const noteText = getAnnotationText();
      if (noteText) {
        const draftNote = getNotebookAnnotationDraft(md5Fingerprint(noteText)) || '';
        setNote(draftNote);
        if (editorRef.current) {
          editorRef.current.value = draftNote;
          editorRef.current.focus();
          adjustHeight();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookNewAnnotation, notebookEditAnnotation]);

  // Function to adjust the height of the textarea dynamically
  const adjustHeight = () => {
    if (editorRef.current) {
      // Set the height to auto to reset it, then set it to the scrollHeight
      editorRef.current.style.height = 'auto';
      editorRef.current.style.height = `${editorRef.current.scrollHeight}px`;
    }
  };

  // Function to get the text of the annotation
  const getAnnotationText = () => {
    return notebookEditAnnotation?.text || notebookNewAnnotation?.text || '';
  };

  // Handle changes to the textarea
  const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    setNote(e.currentTarget.value);
  };

  const handleOnBlur = () => {
    if (editorRef.current && editorRef.current.value) {
      // Save the draft when the editor loses focus
      const noteText = getAnnotationText();
      if (noteText) {
        saveNotebookAnnotationDraft(md5Fingerprint(noteText), editorRef.current.value);
      }
    }
  };

  // Handle saving the note
  const handleSaveNote = () => {
    if (editorRef.current && notebookNewAnnotation) {
      // If it is a new note, call the onSave callback
      onSave(notebookNewAnnotation, editorRef.current.value);
    } else if (editorRef.current && notebookEditAnnotation) {
      // If it is an existing note, update the note and call the onEdit callback
      notebookEditAnnotation.note = editorRef.current.value;
      onEdit(notebookEditAnnotation);
    }
  };

  // Use the useShortcuts hook to handle keyboard shortcuts
  useShortcuts({
    onSaveNote: () => {
      if (editorRef.current && editorRef.current.value) {
        // Save the note on save shortcut
        handleSaveNote();
      }
    },
    // Close the note on close shortcut
    onCloseNote: () => {
      if (notebookNewAnnotation) {
        setNotebookNewAnnotation(null);
      }
      if (notebookEditAnnotation) {
        setNotebookEditAnnotation(null);
      }
    },
  });

  // Render the NoteEditor component
  return (
    <div className='content note-editor-container bg-base-100 mt-2 rounded-md p-2'>
      {/* Textarea container */}
      <div className='flex w-full justify-between space-x-2'>
        <div className='relative w-full'>
          <textarea
            className={clsx(
              'note-editor textarea textarea-ghost min-h-[1em] resize-none !outline-none',
              'inset-0 w-full rounded-none border-0 bg-transparent p-0',
              'content font-size-sm',
            )}
            dir='auto'
            ref={editorRef}
            value={note}
            rows={1}
            spellCheck={false}
            onChange={handleOnChange}
            onBlur={handleOnBlur}
            placeholder={_('Add your notes here...')}
          ></textarea>
        </div>
      </div>
      {/* Annotation text preview */}
      <div className='flex items-start pt-2'>
        <div className='mr-2 min-h-full self-stretch border-l-2 border-gray-300'></div>
        <div className='content font-size-sm line-clamp-3 py-2'>
          <span className='content font-size-xs inline text-gray-500'>{getAnnotationText()}</span>
        </div>
      </div>

      {/* Button container */}
      <div className='flex justify-end p-2' dir='ltr'>
        <button
          className={clsx(
            'content btn btn-ghost font-size-sm hover:bg-transparent',
            'flex h-[1.3em] min-h-[1.3em] items-end p-0',
            editorRef.current && editorRef.current.value ? '' : 'btn-disabled !bg-opacity-0',
          )}
          onClick={handleSaveNote}
        >
          <div className='font-size-sm pr-1 align-bottom text-blue-500'>{_('Save')}</div>
        </button>
      </div>
    </div>
  );
};
// Export the NoteEditor component
export default NoteEditor;
