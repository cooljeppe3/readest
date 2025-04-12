import { BookDoc } from '@/libs/document';
import { BookNote, BookSearchConfig, BookSearchResult } from '@/types/book';
import { TTS } from 'foliate-js/tts.js';
/**
 * @description Granularity for text-to-speech (TTS) operations, specifying whether to process by 'sentence' or 'word'.
 */
export type TTSGranularity = 'sentence' | 'word';

/**
 * @interface FoliateView
 * @description Defines the interface for the Foliate viewer component, which is used to display and interact with book content.
 * It includes methods for book navigation, annotation, searching, text-to-speech, and managing the display.
 */
export interface FoliateView extends HTMLElement {
  /**
   * @description Opens and displays a book in the viewer.
   * @param {BookDoc} book - The book document to be opened.
   * @returns {Promise<void>} A promise that resolves when the book is loaded and displayed.
   */
  open: (book: BookDoc) => Promise<void>;
  /**
   * @description Closes the currently open book in the viewer.
   */
  close: () => void;
  /**
   * @description Initializes the viewer with specific options, such as the last read location.
   * @param {{ lastLocation: string }} options - Initialization options, including the last location.
   */
  init: (options: { lastLocation: string }) => void;
  /**
   * @description Navigates to a specific location within the book using a given href.
   * @param {string} href - The href of the location to navigate to.
   */
  goTo: (href: string) => void;
  /**
   * @description Navigates to a specific fraction of the book.
   * @param {number} fraction - The fraction of the book to navigate to.
   */
  goToFraction: (fraction: number) => void;
  /**
   * @description Navigates to the previous section of the book by a given distance.
   * @param {number} distance - The distance to move backward.
   */
  prev: (distance: number) => void;
  /**
   * @description Navigates to the next section of the book by a given distance.
   * @param {number} distance - The distance to move forward.
   */
  next: (distance: number) => void;
  /**
   * @description Moves to the left in the viewer.
   */
  goLeft: () => void;
  /**
   * @description Moves to the right in the viewer.
   */
  goRight: () => void;
  /**
   * @description Retrieves the CFI (Canonical Fragment Identifier) for a given index and range.
   * @param {number} index - The index for which to get the CFI.
   * @param {Range} range - The range within which to get the CFI.
   * @returns {string} The CFI string.
   */
  getCFI: (index: number, range: Range) => string;
  /**
   * @description Adds or removes an annotation (note) in the book.
   * @param {BookNote} note - The book note to add or remove.
   * @param {boolean} [remove=false] - Whether to remove the note.
   * @returns {{ index: number; label: string }} The index and label of the added or removed annotation.
   */
  addAnnotation: (note: BookNote, remove?: boolean) => { index: number; label: string };
  /**
   * @description Searches the book content based on a given configuration.
   * @param {BookSearchConfig} config - The configuration for the search.
   * @returns {AsyncGenerator<BookSearchResult | string, void, void>} An asynchronous generator for search results.
   */
  search: (config: BookSearchConfig) => AsyncGenerator<BookSearchResult | string, void, void>;
  /**
   * @description Clears the current search results.
   */
  clearSearch: () => void;
  /**
   * @description Selects a specific element in the book content based on the target.
   * @param {string | number | { fraction: number }} target - The target to select.
   */
  select: (target: string | number | { fraction: number }) => void;
  /**
   * @description Deselects the currently selected element.
   */
  deselect: () => void;
  /**
   * @description Initializes the text-to-speech (TTS) functionality with an optional granularity.
   * @param {TTSGranularity} [granularity='sentence'] - The granularity for TTS (sentence or word).
   * @returns {Promise<void>} A promise that resolves when TTS is initialized.
   */
  initTTS: (granularity?: TTSGranularity) => Promise<void>;
  /**
   * @description The currently opened book document.
   */
  book: BookDoc;
  /**
   * @description The TTS instance associated with the viewer.
   */
  tts: TTS | null;
  /**
   * @description Language-related information for the book, including locale and whether it's a CJK language.
   */
  language: {
    locale?: string;
    isCJK?: boolean;
  };
  /**
   * @description History navigation within the book.
   */
  history: {
    /**
     * @description Indicates whether it's possible to go back in the history.
     */
    canGoBack: boolean;
    /**
     * @description Indicates whether it's possible to go forward in the history.
     */
    canGoForward: boolean;
    /**
     * @description Navigates back in the history.
     */
    back: () => void;
    /**
     * @description Navigates forward in the history.
     */
    forward: () => void;
    /**
     * @description Clears the history.
     */
    clear: () => void;
  };
  /**
   * @description Rendering-related properties and methods for the book content.
   */
  renderer: {
    /**
     * @description Indicates whether the content is scrolled.
     */
    scrolled?: boolean;
    /**
     * @description The current page height.
     */
    size: number;
    /**
     * @description The whole document view height.
     */
    viewSize: number;
    /**
     * @description The start position in the book.
     */
    start: number;
    /**
     * @description The end position in the book.
     */
    end: number;
    /**
     * @description Sets an attribute on the renderer.
     * @param {string} name - The name of the attribute.
     * @param {string | number} value - The value of the attribute.
     */
    setAttribute: (name: string, value: string | number) => void;
    /**
     * @description Removes an attribute from the renderer.
     * @param {string} name - The name of the attribute to remove.
     */
    removeAttribute: (name: string) => void;
    /**
     * @description Navigates to the next page.
     * @returns {Promise<void>} A promise that resolves when the navigation is complete.
     */
    next: () => Promise<void>;
    /**
     * @description Navigates to the previous page.
     * @returns {Promise<void>} A promise that resolves when the navigation is complete.
     */
    prev: () => Promise<void>;
    /**
     * @description Navigates to a specific section using an index and an anchor
     * @param {{ index: number; anchor: number }} params - The section to go to.
     */
    goTo?: (params: { index: number; anchor: number }) => void;
    /**
     * @description Sets the styles of the viewer.
     * @param {string} css - The css string to add.
     */
    setStyles?: (css: string) => void;
    /**
     * @description Gets the contents of the current view.
     * @returns {{ doc: Document; index?: number }[]} An array of document fragments.
     */
    getContents: () => { doc: Document; index?: number }[];
    /**
     * @description Adds an event listener to the renderer.
     * @param {string} type - The event type.
     * @param {EventListener} listener - The event listener.
     */
    addEventListener: (type: string, listener: EventListener) => void;
    /**
     * @description Removes an event listener from the renderer.
     * @param {string} type - The event type.
     * @param {EventListener} listener - The event listener.
     */
    removeEventListener: (type: string, listener: EventListener) => void;
  };
}
/**
 * @description Wraps the original FoliateView object to enhance or modify its behavior, such as transforming BookNote objects into Foliate annotations.
 * @param {FoliateView} originalView - The original FoliateView object.
 * @returns {FoliateView} The wrapped FoliateView object with enhanced features.
 */
export const wrappedFoliateView = (originalView: FoliateView): FoliateView => {
  const originalAddAnnotation = originalView.addAnnotation.bind(originalView);
  /**
   * @description Overrides the original `addAnnotation` method to transform a `BookNote` to a `foliate annotation`.
   */
  originalView.addAnnotation = (note: BookNote, remove = false) => {
    /**
     * @description transform BookNote to foliate annotation
     */
    const annotation = {
      value: note.cfi,
      ...note,
    };
    return originalAddAnnotation(annotation, remove);
  };
  return originalView;
};
