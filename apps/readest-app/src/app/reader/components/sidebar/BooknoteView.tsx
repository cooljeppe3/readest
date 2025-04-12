import React from 'react';

// Import the CFI library from foliate-js for comparing EPUB CFI (Canonical Fragment Identifier) values.
import * as CFI from 'foliate-js/epubcfi.js';
// Import the book data store hook to access book-related configurations.
import { useBookDataStore } from '@/store/bookDataStore';
// Import the function to find a table of contents (TOC) item based on a CFI value.
import { findTocItemBS } from '@/utils/toc';
// Import the TOCItem interface to represent an item in the table of contents.
import { TOCItem } from '@/libs/document';
// Import the interface for a group of booknotes and the type for a single booknote.
import { BooknoteGroup, BookNoteType } from '@/types/book';
// Import the component for rendering a single booknote item.
import BooknoteItem from './BooknoteItem';

/**
 * BooknoteView component - Displays a list of booknotes grouped by their associated TOC item.
 *
 * @param {object} props - The properties for the BooknoteView component.
 * @param {BookNoteType} props.type - The type of booknote to display (e.g., 'highlight', 'note').
 * @param {string} props.bookKey - The unique key identifying the book.
 * @param {TOCItem[]} props.toc - The table of contents for the book.
 */
const BooknoteView: React.FC<{
  type: BookNoteType;
  bookKey: string;
  toc: TOCItem[];
}> = ({ type, bookKey, toc }) => {
  // Access the book data store to get book configurations.
  const { getConfig } = useBookDataStore();
  // Retrieve the specific book's configuration using the bookKey.
  const config = getConfig(bookKey)!;
  // Extract all booknotes from the book's configuration, or use an empty array if none exist.
  const { booknotes: allNotes = [] } = config;
  // Filter the booknotes based on the provided type and whether they have been deleted.
  const booknotes = allNotes.filter((note) => note.type === type && !note.deletedAt);

  // booknoteGroups will group booknotes based on the href of their associated TOC item.
  const booknoteGroups: { [href: string]: BooknoteGroup } = {};
  // Iterate through each booknote to create and populate the groups.
  for (const booknote of booknotes) {
    // Find the TOC item associated with the booknote using its CFI value.
    const tocItem = findTocItemBS(toc ?? [], booknote.cfi);
    // Use the href of the TOC item as the group key, or an empty string if no TOC item is found.
    const href = tocItem?.href || '';
    // Get the label and id from the TOC item, or use empty string and 0 as default values.
    const label = tocItem?.label || '';
    const id = tocItem?.id || 0;
    // If no group exists for the current href, create a new one.
    if (!booknoteGroups[href]) {
      booknoteGroups[href] = { id, href, label, booknotes: [] };
    }
    // Add the current booknote to the corresponding group.
    booknoteGroups[href].booknotes.push(booknote);
  }

  // Iterate through each group to sort its booknotes based on their CFI values.
  Object.values(booknoteGroups).forEach((group) => {
    group.booknotes.sort((a, b) => {
      // Use the CFI.compare function from foliate-js to compare two CFI values.
      return CFI.compare(a.cfi, b.cfi);
    });
  });

  // Sort the groups based on the TOC item id.
  const sortedGroups = Object.values(booknoteGroups).sort((a, b) => {
    return a.id - b.id;
  });

  return (
    // Main container for the BooknoteView, styled with rounded corners and padding.
    <div className='rounded pt-2'>
      {/* Unordered list with role 'tree' for accessibility, styled with left and right padding. */}
      <ul role='tree' className='px-2'>
        {/* Iterate through each sorted group and render a list item for it. */}
        {sortedGroups.map((group) => (
          <li key={group.href} className='p-2'>
            <h3 className='content font-size-base line-clamp-1 font-normal'>{group.label}</h3>
            <ul>
              {group.booknotes.map((item, index) => (
                <BooknoteItem key={`${index}-${item.cfi}`} bookKey={bookKey} item={item} />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BooknoteView;
