import React from 'react';
import { BookSearchMatch, BookSearchResult, SearchExcerpt } from '@/types/book'; // Import types for search results and excerpts
import { useReaderStore } from '@/store/readerStore';
import useScrollToItem from '../../hooks/useScrollToItem'; // Custom hook for managing scrolling to items
import clsx from 'clsx';

/**
 * Props for the SearchResultItem component.
 */
interface SearchResultItemProps {
  bookKey: string; // Unique identifier for the book
  cfi: string; // Content Fragment Identifier to locate the search result in the book
  excerpt: SearchExcerpt; // The text excerpt surrounding the search match
  onSelectResult: (cfi: string) => void; // Callback to handle selection of a result
}

/**
 * Displays a single search result item, highlighting the matched text.
 */
const SearchResultItem: React.FC<SearchResultItemProps> = ({
  bookKey,
  cfi,
  excerpt,
  onSelectResult,
}) => {
  const { getProgress } = useReaderStore(); // Access the reader store to get book progress
  const progress = getProgress(bookKey)!; // Get the reading progress for the book
  const { isCurrent, viewRef } = useScrollToItem(cfi, progress); // Custom hook to check if this result is the currently viewed one

  return (
    <li
      ref={viewRef} // Ref to the list item, managed by the useScrollToItem hook
      className={clsx(
        'my-2 cursor-pointer rounded-lg p-2 text-sm',
        isCurrent ? 'bg-base-300 hover:bg-gray-300/70' : 'hover:bg-base-300 bg-base-100', // Highlight the current result
      )}
      onClick={() => onSelectResult(cfi)} // Handle result selection by calling the provided callback
    >
      <div className='line-clamp-3'>
        <span className=''>{excerpt.pre}</span> {/* Text preceding the match */}
        <span className='font-semibold'>{excerpt.match}</span> {/* The matched text, bolded */}
        <span className=''>{excerpt.post}</span> {/* Text following the match */}
      </div>
    </li>
  );
};

/**
 * Props for the SearchResults component.
 */
interface SearchResultsProps {
  bookKey: string; // Unique identifier for the book
  results: BookSearchResult[] | BookSearchMatch[]; // Array of search results or matches
  onSelectResult: (cfi: string) => void; // Callback to handle selection of a result
}

/**
 * Displays a list of search results, categorized if necessary.
 * It maps over an array of results and renders either a single result
 * or a list of results nested under a heading.
 */
const SearchResults: React.FC<SearchResultsProps> = ({ bookKey, results, onSelectResult }) => {
  return (
    <div className='search-results overflow-y-auto p-2 font-sans text-sm font-light'>
      <ul className='px-2'>
        {results.map((result, index) => {
          if ('subitems' in result) {
            return (
              <ul key={`${index}-${result.label}`}>
                <h3 className='line-clamp-1 font-normal'>{result.label}</h3> {/* Category label */}
                <ul>
                  {result.subitems.map((item, index) => (
                    <SearchResultItem
                    /**
                     * Renders a single SearchResultItem
                     * for each subitem in the category
                    */
                      key={`${index}-${item.cfi}`}
                      bookKey={bookKey}
                      cfi={item.cfi}
                      excerpt={item.excerpt}
                      onSelectResult={onSelectResult}
                    />
                  ))}
                </ul>
              </ul>
            );
          } else {
            return (
              <SearchResultItem
              /**
               * Renders a single SearchResultItem
               * when there are no subitems
              */
                key={`${index}-${result.cfi}`}
                bookKey={bookKey}
                cfi={result.cfi}
                excerpt={result.excerpt}
                onSelectResult={onSelectResult}
              />
            );
          }
        })}
      </ul>
    </div>
  );
};

// Export the SearchResults component as the default export
export default SearchResults;
