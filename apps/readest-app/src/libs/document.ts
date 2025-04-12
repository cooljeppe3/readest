import { BookFormat } from '@/types/book';
import { Contributor, LanguageMap } from '@/utils/book';
import * as epubcfi from 'foliate-js/epubcfi.js';
/**
 * Polyfill for the groupBy method on the Object prototype.
 * This is used by foliate-js to group items in an iterable.
 */
Object.groupBy ??= (iterable, callbackfn) => {
  const obj = Object.create(null);
  let i = 0;
  for (const value of iterable) {
    const key = callbackfn(value, i++);
    // if key exists, add to the array, otherwise create a new array
    if (key in obj) {
      obj[key].push(value);
    } else {
      obj[key] = [value];
    }
  }
  return obj;
};
/**
 * Polyfill for the groupBy method on the Map prototype.
 * This is used by foliate-js to group items in an iterable,
 * returning a Map instead of a plain object.
 */
Map.groupBy ??= (iterable, callbackfn) => {
  const map = new Map();
  let i = 0;
  for (const value of iterable) {
    const key = callbackfn(value, i++),
      list = map.get(key);
    if (list) {
      list.push(value);
    } else {
      map.set(key, [value]);
    }
  }
  return map;
};
/**
 * Alias for the epubcfi module from foliate-js.
 * This is used for working with EPUB Canonical Fragment Identifiers (CFI).
 */
export const CFI = epubcfi;

export type DocumentFile = File;
/**
 * Interface for a Table of Contents (TOC) item.
 * Represents an entry in the book's navigation structure.
 */

export interface TOCItem {
  id: number;
  label: string;
  href: string;
  cfi?: string;
  subitems?: TOCItem[];
}

/**
 * Interface for a section item in the document.
 * Represents a logical section within the book's content.
 */
export interface SectionItem {
  id: string;
  cfi: string;
  size: number;
}
/**
 * Interface for a book document.
 * Represents the structure and metadata of a book.
 */
export interface BookDoc {
  // Metadata of the book
  metadata: {
    // NOTE: the title and author fields should be formatted
    title: string | LanguageMap;
    author: string | Contributor;
    language: string | string[];
    editor?: string;
    publisher?: string;
    published?: string;
    description?: string;
    subject?: string[];
    identifier?: string;
  }; // The directory where the book's files are stored
  dir: string;
  // Table of Contents of the book
  toc?: Array<TOCItem>;
  // Sections of the book
  sections?: Array<SectionItem>;
  // The target for transform events
  transformTarget?: EventTarget;
  // Function to split a TOC href into parts
  splitTOCHref(href: string): Array<string | number>;
  // Function to get the book's cover image as a Blob
  getCover(): Promise<Blob | null>;
}
/**
 * Record that maps BookFormat to file extension strings.
 * Defines the valid file extensions for different book formats.
 */
export const EXTS: Record<BookFormat, string> = {
  EPUB: 'epub',
  PDF: 'pdf',
  MOBI: 'mobi',
  CBZ: 'cbz',
  FB2: 'fb2',
  FBZ: 'fbz'
};
/**
 * Class for loading and processing different document types.
 * Handles the logic for identifying file types and loading them accordingly.
 */
export class DocumentLoader {
  private file: File;

  constructor(file: File) {
    this.file = file;
  }

  /**
   * Determines if the file is a ZIP archive by checking its first 4 bytes.
   * @returns {Promise<boolean>} A promise that resolves to true if the file is a ZIP archive, false otherwise.
   */
  private async isZip(): Promise<boolean> {
    const arr = new Uint8Array(await this.file.slice(0, 4).arrayBuffer());
    return arr[0] === 0x50 && arr[1] === 0x4b && arr[2] === 0x03 && arr[3] === 0x04;
  }
  /**
   * Determines if the file is a PDF by checking its first 5 bytes.
   * @returns {Promise<boolean>} A promise that resolves to true if the file is a PDF, false otherwise.
   */
  private async isPDF(): Promise<boolean> {
    // check magic number of pdf
    const arr = new Uint8Array(await this.file.slice(0, 5).arrayBuffer());
    return (
      arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46 && arr[4] === 0x2d
    );
  }

  private async makeZipLoader() {
    /**
     * Helper function to extract the comment from a zip file.
     * @returns {Promise<string | null>} A promise that resolves to the comment if found, null otherwise.
     */
    const getComment = async (): Promise<string | null> => {
      const EOCD_SIGNATURE = [0x50, 0x4b, 0x05, 0x06];
      const maxEOCDSearch = 1024 * 64;

      const sliceSize = Math.min(maxEOCDSearch, this.file.size);
      const tail = await this.file.slice(this.file.size - sliceSize, this.file.size).arrayBuffer();
      const bytes = new Uint8Array(tail);

      for (let i = bytes.length - 22; i >= 0; i--) {
        if (
          bytes[i] === EOCD_SIGNATURE[0] &&
          bytes[i + 1] === EOCD_SIGNATURE[1] &&
          bytes[i + 2] === EOCD_SIGNATURE[2] &&
          bytes[i + 3] === EOCD_SIGNATURE[3]
        ) {
          const commentLength = bytes[i + 20]! + (bytes[i + 21]! << 8);
          const commentStart = i + 22;
          const commentBytes = bytes.slice(commentStart, commentStart + commentLength);
          return new TextDecoder().decode(commentBytes);
        }
      }

      return null;
    };

    // dynamically import from zip.js
    const { configure, ZipReader, BlobReader, TextWriter, BlobWriter } = await import(
      '@zip.js/zip.js'
    );
    type Entry = import('@zip.js/zip.js').Entry;
    configure({ useWebWorkers: false });
    const reader = new ZipReader(new BlobReader(this.file));
    const entries = await reader.getEntries();
    const map = new Map(entries.map((entry) => [entry.filename, entry]));
    // helper function to load file from zip
    const load =
      (f: (entry: Entry, type?: string) => Promise<string | Blob> | null) =>
      (name: string, ...args: [string?]) =>
        map.has(name) ? f(map.get(name)!, ...args) : null;

    const loadText = load((entry: Entry) =>
      entry.getData ? entry.getData(new TextWriter()) : null,
    );
    const loadBlob = load((entry: Entry, type?: string) =>
      entry.getData ? entry.getData(new BlobWriter(type!)) : null,
    );
    const getSize = (name: string) => map.get(name)?.uncompressedSize ?? 0;

    return { entries, loadText, loadBlob, getSize, getComment, sha1: undefined };
  }

  /**
   * Checks if the file is a CBZ file based on its MIME type or file extension.
   * @returns {boolean} True if the file is a CBZ file, false otherwise.
   */
  private isCBZ(): boolean {
    return (
      this.file.type === 'application/vnd.comicbook+zip' || this.file.name.endsWith(`.${EXTS.CBZ}`)
    );
  }
  /**
   * Checks if the file is an FB2 file based on its MIME type or file extension.
   * @returns {boolean} True if the file is an FB2 file, false otherwise.
   */
  private isFB2(): boolean {
    return (
      this.file.type === 'application/x-fictionbook+xml' || this.file.name.endsWith(`.${EXTS.FB2}`)
    );
  }
  /**
   * Checks if the file is an FBZ (zipped FB2) file based on its MIME type or file extension.
   * @returns {boolean} True if the file is an FBZ file, false otherwise.
   */
  private isFBZ(): boolean {
    return (
      // check file type or file name
      this.file.type === 'application/x-zip-compressed-fb2' ||
      this.file.name.endsWith('.fb2.zip') ||
      this.file.name.endsWith(`.${EXTS.FBZ}`)
    );
  }

  public async open(): Promise<{ book: BookDoc; format: BookFormat }> {
    let book: BookDoc | null = null;
    let format: BookFormat = 'EPUB';
    if (!this.file.size) {
      throw new Error('File is empty');
    }
    // if file is zip or mobi
    if (await this.isZip()) {
      // make zip loader
      const loader = await this.makeZipLoader();
      const { entries } = loader;
      // if file is cbz, handle it as comic book
      if (this.isCBZ()) {
        const { makeComicBook } = await import('foliate-js/comic-book.js');
        book = await makeComicBook(loader, this.file);
        format = 'CBZ';
        // if file is fbz, handle it as fb2
      } else if (this.isFBZ()) {
        /**
         * Try to find the .fb2 file in the zip archive,
         * otherwise take the first file in the archive,
         * this is not a standard behavior,
         * but it works in most cases.
         */
        const entry = entries.find((entry) => entry.filename.endsWith(`.${EXTS.FB2}`));
        const blob = await loader.loadBlob((entry ?? entries[0]!).filename);
        const { makeFB2 } = await import('foliate-js/fb2.js');
        book = await makeFB2(blob);
        format = 'FBZ';
      } else {
        const { EPUB } = await import('foliate-js/epub.js');
        book = await new EPUB(loader).init();
        format = 'EPUB';
      }
      // if file is pdf, handle it as pdf
    } else if (await this.isPDF()) {
      const { makePDF } = await import('foliate-js/pdf.js');
      book = await makePDF(this.file);
      format = 'PDF';
      // if file is mobi, handle it as mobi
    } else if (await (await import('foliate-js/mobi.js')).isMOBI(this.file)) {
      const fflate = await import('foliate-js/vendor/fflate.js');
      const { MOBI } = await import('foliate-js/mobi.js');
      // the unzlib function from fflate is required by foliate-js
      book = await new MOBI({ unzlib: fflate.unzlibSync }).open(this.file);
      format = 'MOBI';
      // if file is fb2, handle it as fb2
    } else if (this.isFB2()) {
      const { makeFB2 } = await import('foliate-js/fb2.js');
      book = await makeFB2(this.file);
      format = 'FB2';
    }
    return { book, format } as { book: BookDoc; format: BookFormat };
  }
}
/**
 * Function to determine the reading direction and writing mode of a document.
 * @param {Document} doc - The document to inspect.
 * @returns {{ vertical: boolean, rtl: boolean }} An object with properties 'vertical' (whether the writing mode is vertical)
 * and 'rtl' (whether the direction is right-to-left).
 */
export const getDirection = (doc: Document) => {
  const { defaultView } = doc;
  const { writingMode, direction } = defaultView!.getComputedStyle(doc.body);
  const vertical = writingMode === 'vertical-rl' || writingMode === 'vertical-lr';
  const rtl = doc.body.dir === 'rtl' || direction === 'rtl' || doc.documentElement.dir === 'rtl';
  return { vertical, rtl };
};
