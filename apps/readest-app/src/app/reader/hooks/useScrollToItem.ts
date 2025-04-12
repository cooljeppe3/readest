import { useEffect, useRef, useState } from 'react';
import * as CFI from 'foliate-js/epubcfi.js';
import { BookProgress } from '@/types/book';
/**
 * `useScrollToItem` is a custom React hook that manages the scrolling behavior of a specific item within a book's content.
 * It checks if a given item (identified by its CFI) is within the user's current reading progress and, if so,
 * scrolls the item into view if it's not already visible.
 *
 * @param cfi - The Canonical Fragment Identifier (CFI) of the item to potentially scroll to.
 * @param progress - The user's current reading progress, including the current location in the book.
 * @returns An object containing:
 *   - isCurrent: A boolean indicating whether the item is within the current progress range.
 *   - viewRef: A React ref that should be attached to the item's DOM element.
 */
const useScrollToItem = (cfi: string, progress: BookProgress | null) => {
  // `viewRef` is a React ref that will be attached to the HTML element of the item.
  const viewRef = useRef<HTMLLIElement | null>(null);
  // `isCurrent` is a state variable indicating whether the item is within the current progress range.
  const [isCurrent, setIsCurrent] = useState(false);

  // `useEffect` hook to perform actions when `cfi` or `progress` changes.
  useEffect(() => {
    // If the item's element or the reading progress is not available, exit.
    if (!viewRef.current || !progress) return;

    // Extract the current reading location from the progress object.
    const { location } = progress;
    // Determine the start of the current reading location range by collapsing the CFI.
    const start = CFI.collapse(location);
    // Determine the end of the current reading location range (inclusive) by collapsing the CFI with the 'end' flag.
    const end = CFI.collapse(location, true);
    // Check if the item's CFI is within the current progress range.
    const isCurrent = CFI.compare(cfi, start) >= 0 && CFI.compare(cfi, end) <= 0;
    // Update the `isCurrent` state.
    setIsCurrent(isCurrent);

    // Proceed to scroll the item into view if it is the current item.
    if (isCurrent) {
      // Get a reference to the item's HTML element.
      const element = viewRef.current;
      // Get the item's bounding rectangle relative to the viewport.
      const rect = element.getBoundingClientRect();
      // Check if the item is currently visible in the viewport.
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

      // If the item is not visible, scroll it into view.
      if (!isVisible) {
        // `scrollIntoView` is a method that scrolls the element into the visible area of the browser window.
        // `behavior: 'smooth'` makes the scrolling smooth.
        // `block: 'center'` positions the element in the center of the viewport.
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Set the 'aria-current' attribute for accessibility, indicating that this is the current item.
      element.setAttribute('aria-current', 'page');
    }
    // The effect will run whenever `cfi`, `progress`, or `viewRef` changes.
  }, [cfi, progress, viewRef]);

  return { isCurrent, viewRef };
};

export default useScrollToItem;
