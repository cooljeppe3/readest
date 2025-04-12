import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSyncContext } from '@/context/SyncContext';
import { SyncData, SyncOp, SyncResult, SyncType } from '@/libs/sync';
import { useSettingsStore } from '@/store/settingsStore';
import { useBookDataStore } from '@/store/bookDataStore';
import { transformBookConfigFromDB } from '@/utils/transform';
import { transformBookNoteFromDB } from '@/utils/transform';
import { transformBookFromDB } from '@/utils/transform';
import { DBBook, DBBookConfig, DBBookNote } from '@/types/records';
import { Book, BookConfig, BookDataRecord, BookNote } from '@/types/book';
import { navigateToLogin } from '@/utils/nav';

// An object that maps data types to their respective transformation functions from database format.
const transformsFromDB = {
  books: transformBookFromDB,
  notes: transformBookNoteFromDB,
  configs: transformBookConfigFromDB,
};

// Function to compute the maximum timestamp from a list of records.
const computeMaxTimestamp = (records: BookDataRecord[]): number => {
  let maxTime = 0;
  for (const rec of records) {
    if (rec.updated_at) {
      const updatedTime = new Date(rec.updated_at).getTime();
      maxTime = Math.max(maxTime, updatedTime);
    }
    if (rec.deleted_at) {
      const deletedTime = new Date(rec.deleted_at).getTime();
      maxTime = Math.max(maxTime, deletedTime);
    }
  }
  return maxTime;
};

// Constant representing seven days in milliseconds.
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

// Custom hook for managing synchronization of books, configs, and notes.
export function useSync(bookKey?: string) {
  const router = useRouter();
  // Access settings and book configurations through stores.
  const { settings, setSettings } = useSettingsStore();
  const { getConfig, setConfig } = useBookDataStore();
  const config = bookKey ? getConfig(bookKey) : null;

  const [syncingBooks, setSyncingBooks] = useState(false);
  const [syncingConfigs, setSyncingConfigs] = useState(false);
  const [syncingNotes, setSyncingNotes] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAtBooks, setLastSyncedAtBooks] = useState<number>(0);
  // states to track last synced at for different types
  const [lastSyncedAtConfigs, setLastSyncedAtConfigs] = useState<number>(0);
  const [lastSyncedAtNotes, setLastSyncedAtNotes] = useState<number>(0);
  const lastSyncedAtInited = useRef(false);

  const [syncing, setSyncing] = useState(false);
  // null means unsynced, empty array means synced no changes
  const [syncResult, setSyncResult] = useState<SyncResult>({
    books: null,
    // states for synced data
    configs: null,
    notes: null,
  });
  const [syncedBooks, setSyncedBooks] = useState<Book[] | null>(null);
  const [syncedConfigs, setSyncedConfigs] = useState<BookConfig[] | null>(null);
  const [syncedNotes, setSyncedNotes] = useState<BookNote[] | null>(null);

  const { syncClient } = useSyncContext();

  useEffect(() => {
    // Initialize last synced times based on settings and config on mount.
    if (!settings || !config) return;
    if (lastSyncedAtInited.current) return;
    lastSyncedAtInited.current = true;

    const lastSyncedBooksAt = settings.lastSyncedAtBooks ?? 0;
    const lastSyncedConfigsAt = config?.lastSyncedAtConfig ?? settings.lastSyncedAtConfigs ?? 0;
    const lastSyncedNotesAt = config?.lastSyncedAtNotes ?? settings.lastSyncedAtNotes ?? 0;
    setLastSyncedAtBooks(lastSyncedBooksAt > 0 ? lastSyncedBooksAt - SEVEN_DAYS_IN_MS : 0);
    setLastSyncedAtConfigs(lastSyncedConfigsAt > 0 ? lastSyncedConfigsAt - SEVEN_DAYS_IN_MS : 0);
    setLastSyncedAtNotes(lastSyncedNotesAt > 0 ? lastSyncedNotesAt - SEVEN_DAYS_IN_MS : 0);
  }, [settings, config]);

  // bookId is for configs and notes only, if bookId is provided, only pull changes for that book
  // and update the lastSyncedAt for that book in the book config
  // Function to pull changes from the server for a specific type of data.
  const pullChanges = async (
    type: SyncType,
    since: number,
    setLastSyncedAt: React.Dispatch<React.SetStateAction<number>>,
    setSyncing: React.Dispatch<React.SetStateAction<boolean>>,
    bookId?: string,
  ) => {
    setSyncing(true);
    // Reset the sync error.
    setSyncError(null);

    try {
      // Pull changes from the server.
      const result = await syncClient.pullChanges(since, type, bookId);
      // Update the sync result with the data pulled.
      setSyncResult({ ...syncResult, [type]: result[type] });
      const records = result[type];
      if (!records?.length) return;
      // Compute the maximum timestamp from the pulled records.
      const maxTime = computeMaxTimestamp(records);
      setLastSyncedAt(maxTime);

      // due to closures in React hooks the settings might be stale
      // we need to fetch the latest settings from store
      const settings = useSettingsStore.getState().settings;
        // Update the last synced time in settings or book config based on the type.
        switch (type) {
        case 'books':
          settings.lastSyncedAtBooks = maxTime;
          setSettings(settings);
          break;
        case 'configs':
          if (!bookId) {
            settings.lastSyncedAtConfigs = maxTime;
            setSettings(settings);
          } else if (bookKey && config) {
            config.lastSyncedAtConfig = maxTime;
            setConfig(bookKey, config);
          }
          break;
        case 'notes':
          if (!bookId) {
            settings.lastSyncedAtNotes = maxTime;
            setSettings(settings);
          } else if (bookKey && config) {
            config.lastSyncedAtNotes = maxTime;
            setConfig(bookKey, config);
          }
          break;
      }
    } catch (err: unknown) {
        // Handle any errors during the synchronization process.
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes('Not authenticated') && settings.keepLogin) {
          // Handle the case where the user is not authenticated.
          settings.keepLogin = false;
          setSettings(settings);
          navigateToLogin(router);
        }
        setSyncError(err.message || `Error pulling ${type}`);
      } else {
        setSyncError(`Error pulling ${type}`);
      }
    } finally {
      setSyncing(false);
    }
  };

  // Function to push changes to the server.
  const pushChanges = async (payload: SyncData) => {
    setSyncing(true);
    setSyncError(null);

    try {
      // Push changes to the server.
      const result = await syncClient.pushChanges(payload);
          setSyncResult(result);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setSyncError(err.message || 'Error pushing changes');
      } else {
        setSyncError('Error pushing changes');
      }
    } finally {
      setSyncing(false);
    }
  };

  // Function to synchronize books.
  const syncBooks = async (books?: Book[], op: SyncOp = 'both') => {
    if ((op === 'push' || op === 'both') && books?.length) {
      await pushChanges({ books });
    }
    if (op === 'pull' || op === 'both') {
      await pullChanges('books', lastSyncedAtBooks, setLastSyncedAtBooks, setSyncingBooks);
    }
  };
  // Function to synchronize book configurations.

  const syncConfigs = async (bookConfigs?: BookConfig[], bookId?: string, op: SyncOp = 'both') => {
    if ((op === 'push' || op === 'both') && bookConfigs?.length) {
      await pushChanges({ configs: bookConfigs });
    }
    if (op === 'pull' || op === 'both') {
      await pullChanges(
        'configs',
        lastSyncedAtConfigs,
        setLastSyncedAtConfigs,
        setSyncingConfigs,
        bookId,
      );
    }
  };

  // Function to synchronize book notes.
  const syncNotes = async (bookNotes?: BookNote[], bookId?: string, op: SyncOp = 'both') => {
    if ((op === 'push' || op === 'both') && bookNotes?.length) {
      await pushChanges({ notes: bookNotes });
    }
    if (op === 'pull' || op === 'both') {
      await pullChanges('notes', lastSyncedAtNotes, setLastSyncedAtNotes, setSyncingNotes, bookId);
    }
  };

  // Effect to transform and update synced data when syncResult changes.
  useEffect(() => {
    if (!syncing && syncResult) {
      const { books: dbBooks, configs: dbBookConfigs, notes: dbBookNotes } = syncResult;
      // Transform database format to application format for each type.
      const books = dbBooks?.map((dbBook) =>
          transformsFromDB['books'](dbBook as unknown as DBBook),
      );
      const configs = dbBookConfigs?.map((dbBookConfig) =>
        transformsFromDB['configs'](dbBookConfig as unknown as DBBookConfig),
      );
      const notes = dbBookNotes?.map((dbBookNote) =>
        transformsFromDB['notes'](dbBookNote as unknown as DBBookNote),
      );
      if (books) setSyncedBooks(books);
      if (configs) setSyncedConfigs(configs);
      if (notes) setSyncedNotes(notes);
    }
  }, [syncResult, syncing]);

    // Return the synchronization status, data, and functions.
  return {
    syncing: syncingBooks || syncingConfigs || syncingNotes,
    syncError,
    syncResult,
    syncedBooks,
    syncedConfigs,
    syncedNotes,
    lastSyncedAtBooks,
    lastSyncedAtNotes,
    lastSyncedAtConfigs,
    pullChanges,
    pushChanges,
    syncBooks,
    syncConfigs,
    syncNotes,
  };
}
