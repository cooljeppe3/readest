// Define the supported book formats.
export type BookFormat = 'EPUB' | 'PDF' | 'MOBI' | 'CBZ' | 'FB2' | 'FBZ';

// Define the types of notes that can be associated with a book.
export type BookNoteType = 'bookmark' | 'annotation' | 'excerpt';

// Define the styles for highlighting text within a book.
export type HighlightStyle = 'highlight' | 'underline' | 'squiggly';

// Define the available colors for highlighting text.
export type HighlightColor = 'red' | 'yellow' | 'green' | 'blue' | 'violet';

// Interface for a Book object, representing a single book in the library.
export interface Book {
  // If Book is a remote book, we lazy-load the content via this URL.
  url?: string;
  // If Book is a transient local book, we can load the content via this file path.
  filePath?: string;
  // Unique hash for the book, used for identification.
  hash: string;
  // The format of the book (e.g., EPUB, PDF).
  format: BookFormat;
  // The title of the book.
  title: string;
  // The author of the book.
  author: string;
  group?: string; // deprecated in favor of groupId and groupName
  groupId?: string;
  groupName?: string;
  tags?: string[];
  coverImageUrl?: string | null;

  // Timestamp of when the book was created.
  createdAt: number;
  // Timestamp of when the book was last updated.
  updatedAt: number;
  // Timestamp of when the book was deleted (if deleted).
  deletedAt?: number | null;

  // Timestamp of when the book was uploaded.
  uploadedAt?: number | null;
  // Timestamp of when the book was downloaded.
  downloadedAt?: number | null;

  lastUpdated?: number; // deprecated in favor of updatedAt
  // Current progress in the book: [current page number, total page number], 1-based page number.
  progress?: [number, number];
}

// Interface for a Book Group, representing a group or collection of books.
export interface BookGroupType {
  // Unique identifier for the group.
  id: string;
  // Name of the group.
  name: string;
}

// Interface for Page Info, representing the current page and total pages.
export interface PageInfo {
  // The current page number.
  current: number;
  // The next page number, if applicable.
  next?: number;
  // The total number of pages.
  total: number;
}

// Interface for a Book Note, representing a note or annotation within a book.
export interface BookNote {
  // The hash of the book this note is associated with.
  bookHash?: string;
  // Unique identifier for the note.
  id: string;
  // Type of the note (e.g., bookmark, annotation).
  type: BookNoteType;
  // The CFI (Canonical Fragment Identifier) location of the note within the book.
  cfi: string;
  // The text associated with the note.
  text?: string;
  // The style of the highlight (e.g., highlight, underline).
  style?: HighlightStyle;
  // The color of the highlight.
  color?: HighlightColor;
  // The note's content.
  note: string;
  // Timestamp of when the note was created.
  createdAt: number;
  // Timestamp of when the note was last updated.
  updatedAt: number;
  // Timestamp of when the note was deleted (if deleted).
  deletedAt?: number | null;
}

// Interface for grouping book notes by location
export interface BooknoteGroup {
  id: number;
  href: string;
  label: string;
  booknotes: BookNote[];
}

// Define the possible writing modes for a book.
export type WritingMode = 'auto' | 'horizontal-tb' | 'horizontal-rl' | 'vertical-rl';

// Interface for Book Layout, configuring the display and layout of a book.
export interface BookLayout {
  // The margin around the book content in pixels.
  marginPx: number;
  // The gap between columns in percentage.
  gapPercent: number;
  // Whether scrolling is enabled.
  scrolled: boolean;
  // Whether clicking is disabled.
  disableClick: boolean;
  // Whether the click areas are swapped.
  swapClickArea: boolean;
  // Whether continuous scrolling is enabled.
  continuousScroll: boolean;
  // The maximum number of columns to display.
  maxColumnCount: number;
  // The maximum inline size of the book content.
  maxInlineSize: number;
  // The maximum block size of the book content.
  maxBlockSize: number;
  // Whether animations are enabled.
  animated: boolean;
  // The writing mode of the book (e.g., horizontal, vertical).
  writingMode: WritingMode;
  // Whether vertical layout is enabled.
  vertical: boolean;
  // Whether right-to-left text direction is enabled.
  rtl: boolean;
  // Whether a double border is displayed around the content.
  doubleBorder: boolean;
  // The color of the border.
  borderColor: string;
  // Whether to show the header.
  showHeader: boolean;
  // Whether to show the footer.
  showFooter: boolean;
}

// Interface for Book Style, configuring the text styles of a book.
export interface BookStyle {
  // The zoom level of the book content.
  zoomLevel: number;
  // The margin between paragraphs.
  paragraphMargin: number;
  // The line height of the text.
  lineHeight: number;
  // The spacing between words.
  wordSpacing: number;
  // The spacing between letters.
  letterSpacing: number;
  // The indentation of the first line of a paragraph.
  textIndent: number;
  // Whether full justification is enabled.
  fullJustification: boolean;
  // Whether hyphenation is enabled.
  hyphenation: boolean;
  // Whether to invert the colors of the book.
  invert: boolean;
  // The theme of the book (e.g., light, dark).
  theme: string;
  // Whether to override the default font.
  overrideFont: boolean;
  // Whether to override the default layout.
  overrideLayout: boolean;
  // User-defined CSS stylesheet to apply to the book.
  userStylesheet: string;
}

// Interface for Book Font, configuring the fonts used in a book.
export interface BookFont {
  // The font to use for serif text.
  serifFont: string;
  // The font to use for sans-serif text.
  sansSerifFont: string;
  // The font to use for monospace text.
  monospaceFont: string;
  // The default font to use.
  defaultFont: string;
  // The default font to use for CJK (Chinese, Japanese, Korean) characters.
  defaultCJKFont: string;
  // The default font size.
  defaultFontSize: number;
  // The minimum font size.
  minimumFontSize: number;
  // The font weight.
  fontWeight: number;
}

// Interface for View Config, configuring the overall view settings.
export interface ViewConfig {
  // The currently active tab in the sidebar.
  sideBarTab: string;
  // The UI language.
  uiLanguage: string;
}

// Interface for TTS (Text-to-Speech) Config.
export interface TTSConfig {
  // The speech rate for TTS.
  ttsRate: number;
  // The voice to use for TTS.
  ttsVoice: string;
}

// Combined interface for View Settings, integrating all configuration interfaces.
export interface ViewSettings extends BookLayout, BookStyle, BookFont, ViewConfig, TTSConfig {}

// Interface for Book Progress, detailed information about reading progress.
export interface BookProgress {
  // The current location in the book (e.g., CFI).
  location: string;
  // The ID of the current section.
  sectionId: number;
  // The link of the current section.
  sectionHref: string;
  // The label of the current section.
  sectionLabel: string;
  // Page information of current section
  section: PageInfo;
  // Page information of current page
  pageinfo: PageInfo;
  // Current selection range.
  range: Range;
}

// Interface for Book Search Config, settings for searching within a book.
export interface BookSearchConfig {
  // Scope of the search, either within the whole book or a specific section.
  scope: 'book' | 'section';
  // Whether the search should be case-sensitive.
  matchCase: boolean;
  // Whether to match whole words only.
  matchWholeWords: boolean;
  // Whether to match diacritics.
  matchDiacritics: boolean;
  // index of the current search.
  index?: number;
  // query string to search.
  query?: string;
}

// Interface for a search result excerpt, containing pre, match, and post context.
export interface SearchExcerpt {
  // Text preceding the match.
  pre: string;
  // The matched text.
  match: string;
  // Text following the match.
  post: string;
}

// Interface for a search result match within a book.
export interface BookSearchMatch {
  // The CFI location of the match within the book.
  cfi: string;
  // The excerpt of the match.
  excerpt: SearchExcerpt;
}

// Interface for a search result in a book.
export interface BookSearchResult {
  // The label or context of the search result.
  label: string;
  // Sub-items or specific matches within the result.
  subitems: BookSearchMatch[];
  // The progress of the search.
  progress?: number;
}

export interface BookConfig {
  bookHash?: string;
  progress?: [number, number]; // [current pagenum, total pagenum], 1-based page number
  // location of the current page.
  location?: string;
  // book notes related to this book.
  booknotes?: BookNote[];
  // configurations of book search
  searchConfig?: Partial<BookSearchConfig>;
  // view settings of the book.
  viewSettings?: Partial<ViewSettings>;

  // Timestamp of the last time the book config was synced.
  lastSyncedAtConfig?: number;
  // Timestamp of the last time the book notes were synced.
  lastSyncedAtNotes?: number;
  //Timestamp of when the book config was updated.
  updatedAt: number;
}

// Interface for a Book Data Record, representing book metadata in a database.
export interface BookDataRecord {
  // Unique identifier for the record.
  id: string;
  // The hash of the book.
  book_hash: string;
  // The ID of the user associated with the record.
  user_id: string;
  // Timestamp of when the record was last updated.
  updated_at: number | null;
  // Timestamp of when the record was deleted (if deleted).
  deleted_at: number | null;
}

// Interface for Books Group, representing a group of books with metadata.
export interface BooksGroup {
  // Unique identifier for the group.
  id: string;
  // Name of the group.
  name: string;
  // List of books in the group.
  books: Book[];
  // timestamp of when the book group was updated.
  updatedAt: number;
}
// Interface of the book and its config
export interface BookContent {
  book: Book;
  file: File;
  config: BookConfig;
}
