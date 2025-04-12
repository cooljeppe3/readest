/**
 * Represents a book stored in the database.
 */
export interface DBBook {
  /** The ID of the user who owns the book. */
  user_id: string;
  /** A unique hash for the book, used for identification. */
  book_hash: string;
  /** The file format of the book (e.g., "epub", "pdf"). */
  format: string;
  /** The title of the book. */
  title: string;
  /** The author of the book. */
  author: string;
  /** The ID of the group this book belongs to, if any. */
  group_id?: string;
  /** The name of the group this book belongs to, if any. */
  group_name?: string;
  /** An array of tags associated with the book. */
  tags?: string[];
  /** An array representing the user's reading progress in the book.
   * The first element is the current position, the second the total
   * positions.
   */
  progress?: [number, number];

  /** The timestamp when the book was created in the database. */
  created_at?: string;
  /** The timestamp when the book was last updated in the database. */
  updated_at?: string;
  /** The timestamp when the book was deleted, or null if not deleted. */
  deleted_at?: string | null;
  /** The timestamp when the book was uploaded. */
  uploaded_at?: string | null;
}

/**
 * Represents configuration data for a book stored in the database.
 */
export interface DBBookConfig {
  user_id: string;
  book_hash: string;
  location?: string;
  progress?: string;
  search_config?: string;
  view_settings?: string;

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * Represents a note associated with a book stored in the database.
 */
export interface DBBookNote {
  user_id: string;
  book_hash: string;
  id: string;
  type: string;
  cfi: string;
  text?: string;
  style?: string;
  color?: string;
  note: string;

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
