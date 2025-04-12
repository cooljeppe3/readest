import { SystemSettings } from './settings';
import { Book, BookConfig, BookContent } from './book';
import { BookDoc } from '@/libs/document';
import { ProgressHandler } from '@/utils/transfer';

// Define the types of platforms the app can run on.
export type AppPlatform = 'web' | 'tauri';

// Define the base directories where files can be stored.
export type BaseDir = 'Books' | 'Settings' | 'Data' | 'Log' | 'Cache' | 'None';

// FileSystem interface defines the operations for interacting with the file system.
export interface FileSystem {
  /**
   * Gets the URL of a file at the specified path.
   * @param path The path to the file.
   * @returns The URL of the file.
   */
  getURL(path: string): string;
  /**
   * Gets the Blob URL of a file in a specified base directory.
   * @param path The path of the file.
   * @param base The base directory for the file.
   * @returns A Promise that resolves with the Blob URL.
   */
  getBlobURL(path: string, base: BaseDir): Promise<string>;
  /**
   * Opens a file from a specified base directory.
   * @param path The path of the file.
   * @param base The base directory for the file.
   * @param filename Optional filename, defaults to the last segment of path.
   * @returns A Promise that resolves with the File object.
   */
  openFile(path: string, base: BaseDir, filename?: string): Promise<File>;
  /**
   * Copies a file from one location to another within a base directory.
   * @param srcPath The source path of the file.
   * @param dstPath The destination path for the file.
   * @param base The base directory for the operation.
   * @returns A Promise that resolves when the copy is complete.
   */
  copyFile(srcPath: string, dstPath: string, base: BaseDir): Promise<void>;
  /**
   * Reads a file from a specified base directory.
   * @param path The path of the file.
   * @param base The base directory for the file.
   * @param mode The mode in which to read the file ('text' or 'binary').
   * @returns A Promise that resolves with the content of the file.
   */
  readFile(path: string, base: BaseDir, mode: 'text' | 'binary'): Promise<string | ArrayBuffer>;
  /**
   * Writes content to a file in a specified base directory.
   * @param path The path where the file should be written.
   * @param base The base directory for the file.
   * @param content The content to write to the file.
   * @returns A Promise that resolves when the write is complete.
   */
  writeFile(path: string, base: BaseDir, content: string | ArrayBuffer | File): Promise<void>;
  removeFile(path: string, base: BaseDir): Promise<void>;
  readDir(path: string, base: BaseDir): Promise<{ path: string; isDir: boolean }[]>;
  createDir(path: string, base: BaseDir, recursive?: boolean): Promise<void>;
  removeDir(path: string, base: BaseDir, recursive?: boolean): Promise<void>;
  exists(path: string, base: BaseDir): Promise<boolean>;
    /** Get the prefix of the base path */
  getPrefix(base: BaseDir): string | null;
}

// AppService interface defines the core service operations for the application.
export interface AppService {
  fs: FileSystem;
  osPlatform: string;
  appPlatform: AppPlatform;
  hasTrafficLight: boolean;
  hasWindow: boolean;
  hasWindowBar: boolean;
  hasContextMenu: boolean;
  hasRoundedWindow: boolean;
  hasSafeAreaInset: boolean;
  hasHaptics: boolean;
  hasSysFontsList: boolean;
  isMobile: boolean;
  isAppDataSandbox: boolean;
  isAndroidApp: boolean;
  isIOSApp: boolean;
  /**
   * Select a directory
   */
  selectDirectory(): Promise<string>;
    /**
   * Select multiple files
   * @param name filter files
   * @param extensions filter file extensions
   */
  selectFiles(name: string, extensions: string[]): Promise<string[]>;
    /**
   * Load system settings
   */
  loadSettings(): Promise<SystemSettings>;
      /**
   * save system settings
   * @param settings 
   */
  saveSettings(settings: SystemSettings): Promise<void>;
  /**
   * Import a book to library
   * @param file The path of the book to import.
   * @param books The list of current books.
   * @param saveBook Whether to save the book data.
   * @param saveCover Whether to save the book cover image.
   * @param overwrite Whether to overwrite an existing book.
   * @param transient Whether to treat the book as transient.
   * @returns A Promise that resolves with the imported book or null if import failed.
   */
  importBook(
    file: string | File,
    books: Book[],
    saveBook?: boolean,
    saveCover?: boolean,
    overwrite?: boolean,
    transient?: boolean,
  ): Promise<Book | null>;  /**
  * Delete book file
  * @param book 
  * @param includingUploaded 
  */
  deleteBook(book: Book, includingUploaded?: boolean): Promise<void>;
  /**
   * Upload book to cloud
   * @param book 
   * @param onProgress callback for progress
   */
  uploadBook(book: Book, onProgress?: ProgressHandler): Promise<void>;
  /**
   * Download book from cloud
   * @param book 
   * @param onlyCover 
   * @param onProgress callback for progress
   */
  downloadBook(book: Book, onlyCover?: boolean, onProgress?: ProgressHandler): Promise<void>;
  /**
   * Load book config
   * @param book 
   * @param settings 
   */
  loadBookConfig(book: Book, settings: SystemSettings): Promise<BookConfig>;
  /**
   * Fetch book details from cloud
   * @param book 
   * @param settings 
   */
  fetchBookDetails(book: Book, settings: SystemSettings): Promise<BookDoc['metadata']>;
    /**
   * save book config
   * @param book 
   * @param config 
   * @param settings 
   */
  saveBookConfig(book: Book, config: BookConfig, settings?: SystemSettings): Promise<void>;
    /**
   * Load the book content
   * @param book 
   * @param settings 
   */
  loadBookContent(book: Book, settings: SystemSettings): Promise<BookContent>;
  /**
   * Load library books
   */
  loadLibraryBooks(): Promise<Book[]>;
  /**
   * Save the library books
   * @param books 
   */
  saveLibraryBooks(books: Book[]): Promise<void>;
  /**
   * Get the book cover URL
   * @param book 
   */
  getCoverImageUrl(book: Book): string;
  /**
   * Get book cover blob url
   * @param book 
   */
  getCoverImageBlobUrl(book: Book): Promise<string>;
  /**
   * Generate book cover image url
   * @param book 
   */
  generateCoverImageUrl(book: Book): Promise<string>;
}
