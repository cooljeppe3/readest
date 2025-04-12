import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSync } from '@/hooks/useSync';
import { BookNote } from '@/types/book';
import { useBookDataStore } from '@/store/bookDataStore';
import { SYNC_NOTES_INTERVAL_SEC } from '@/services/constants';
/**
 * Custom hook to synchronize book notes with a remote data source.
 * It handles fetching new notes, syncing changes, and updating the local store.
 *
 * @param {string} bookKey - The unique identifier for the book.
 */
export const useNotesSync = (bookKey: string) => {
  // Retrieve user information from the authentication context.
  const { user } = useAuth();
  // Retrieve sync-related functions and data from the useSync hook.
  const { syncedNotes, syncNotes, lastSyncedAtNotes } = useSync(bookKey);
  // Retrieve configuration management functions from the book data store.
  const { getConfig, setConfig } = useBookDataStore();

  // Retrieve the book's configuration data.
  const config = getConfig(bookKey);
  // Extract the book hash from the book key.
  const bookHash = bookKey.split('-')[0]!;

  // Store the timestamp of the last successful sync.
  const lastSyncTime = useRef<number>(0);
  // Store the timeout reference for the scheduled sync.
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Retrieves new notes that have been updated or created since the last sync.
   *
   * @returns {BookNote[]} - An array of new notes.
   */
  const getNewNotes = () => {
    // If there's no book location or no user, there's nothing to sync.
    if (!config?.location || !user) return [];
    // Retrieve all book notes from the configuration.
    const bookNotes = config.booknotes ?? [];
    // Filter out the notes that are new or have been updated since the last sync.
    const newNotes = bookNotes.filter(
      (note) => lastSyncedAtNotes < note.updatedAt || lastSyncedAtNotes < (note.deletedAt ?? 0),
    );
    // Assign the book hash to each new note.
    newNotes.forEach((note) => {
      note.bookHash = bookHash;
    });
    return newNotes;
  };

  // Effect to handle note synchronization.
  useEffect(() => {
    if (!config?.location || !user) return;
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTime.current;
    // If the time since the last sync is greater than the defined interval.
    if (timeSinceLastSync > SYNC_NOTES_INTERVAL_SEC * 1000) {
      lastSyncTime.current = now;
      const newNotes = getNewNotes();
      syncNotes(newNotes, bookHash, 'both');
    } else {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(
        () => {
          lastSyncTime.current = Date.now();
          const newNotes = getNewNotes();
          syncNotes(newNotes, bookHash, 'both');
          syncTimeoutRef.current = null;
        },
        SYNC_NOTES_INTERVAL_SEC * 1000 - timeSinceLastSync,
      );
    }
    // Run this effect whenever the config changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Effect to handle new notes received from the sync process.
  useEffect(() => {
    /**
     * Processes a new note by merging it with an existing note if one exists.
     *
     * @param {BookNote} note - The new note to process.
     * @returns {BookNote} - The merged or new note.
     */
    const processNewNote = (note: BookNote) => {
      // Retrieve all old notes from config
      const oldNotes = config?.booknotes ?? [];
      // Find the existing note that has the same id as new note
      const existingNote = oldNotes.find((oldNote) => oldNote.id === note.id);
      // If existing note found
      if (existingNote) {
        // Check if existing note is older than new note
        if (existingNote.updatedAt < note.updatedAt) {
          // merge existing note with new note
          return { ...existingNote, ...note };
        } else {
          // merge new note with existing note
          return { ...note, ...existingNote };
        }
      }
      // Return the new note
      return note;
    };
    // Check if there are notes to sync and config exists
    if (syncedNotes?.length && config) {
      const newNotes = syncedNotes.filter((note) => note.bookHash === bookHash);
      if (!newNotes.length) return;
      const oldNotes = config.booknotes ?? [];
      // Merge old notes with new notes and process them
      const mergedNotes = [...oldNotes.filter((oldNote) => !newNotes.some((newNote) => newNote.id === oldNote.id)),...newNotes.map(processNewNote),];
      // Update the config with new merged notes
      setConfig(bookKey, { booknotes: mergedNotes });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedNotes]);
};
