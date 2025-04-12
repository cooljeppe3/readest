// Import necessary types and utilities
import { Book, BookConfig, BookNote, BookDataRecord } from '@/types/book';
import { getAPIBaseUrl } from '@/services/environment';
import { getAccessToken } from '@/utils/access';

// Define the base URL for the sync API endpoint
const SYNC_API_ENDPOINT = getAPIBaseUrl() + '/sync';

// Define types for synchronization
export type SyncType = 'books' | 'configs' | 'notes';
export type SyncOp = 'push' | 'pull' | 'both';

// Define interfaces for book, book configuration, and book note records, extending BookDataRecord
// These interfaces are used to handle data synchronization with the server
interface BookRecord extends BookDataRecord, Book {}
interface BookConfigRecord extends BookDataRecord, BookConfig {}
interface BookNoteRecord extends BookDataRecord, BookNote {}

// Interface for the result of a synchronization operation
// Describes the structure of the data returned after pulling or pushing changes
export interface SyncResult {
  // Array of book records or null if no changes or errors occurred
  books: BookRecord[] | null;
  // Array of book note records or null if no changes or errors occurred
  notes: BookNoteRecord[] | null;
  // Array of book configuration records or null if no changes or errors occurred
  configs: BookConfigRecord[] | null;
}

// Interface for data to be synchronized
// This is the structure of the payload sent to the server when pushing changes
export interface SyncData {
  // Optional array of book records, partial since not all fields are required for updates
  books?: Partial<BookRecord>[];
  // Optional array of book note records, partial for the same reason
  notes?: Partial<BookNoteRecord>[];
  // Optional array of book configuration records, partial for the same reason
  configs?: Partial<BookConfigRecord>[];
}

// Class for handling synchronization with the server
// Encapsulates the logic for pulling and pushing changes
export class SyncClient {
  /**
   * Pull incremental changes since a given timestamp (in ms).
   * Returns updated or deleted records since that time.
   */
  // Method to pull changes from the server
  // Accepts a timestamp (since) to fetch changes that occurred after that time,
  // an optional type to filter changes, and an optional book to filter by book ID.
  async pullChanges(since: number, type?: SyncType, book?: string): Promise<SyncResult> {
    // Retrieve the access token for authentication
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');

    // Construct the API URL with query parameters
    const url = `${SYNC_API_ENDPOINT}?since=${encodeURIComponent(since)}&type=${type ?? ''}&book=${book ?? ''}`;
    // Make a GET request to the server with the access token in the header
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      // If the response is not okay, parse the error and throw it
      const error = await res.json();
      throw new Error(`Failed to pull changes: ${error.error || res.statusText}`);
    }

    // Parse and return the JSON response
    return res.json();
  }

  /**
   * Push local changes to the server.
   * Uses last-writer-wins logic as implemented on the server side.
   */
  // Method to push changes to the server
  // Accepts a payload of type SyncData, which includes books, notes, and configurations to update
  async pushChanges(payload: SyncData): Promise<SyncResult> {
    // Retrieve the access token for authentication
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(SYNC_API_ENDPOINT, {
      // Make a POST request to the server with the payload
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // If the response is not okay, parse the error and throw it
      const error = await res.json();
      throw new Error(`Failed to push changes: ${error.error || res.statusText}`);
    }

    // Parse and return the JSON response
    return res.json();
  }
}
