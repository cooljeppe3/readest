import React, { useEffect, useRef, useState } from 'react';
import { BookDoc, getDirection } from '@/libs/document';
import { BookConfig } from '@/types/book';
import { FoliateView, wrappedFoliateView } from '@/types/view';
import { useThemeStore } from '@/store/themeStore';
import { useReaderStore } from '@/store/readerStore';
import { useParallelViewStore } from '@/store/parallelViewStore';
import { useClickEvent, useTouchEvent } from '../hooks/useIframeEvents';
import { useFoliateEvents } from '../hooks/useFoliateEvents';
import { useProgressSync } from '../hooks/useProgressSync';
import { useProgressAutoSave } from '../hooks/useProgressAutoSave';
import { getStyles, mountAdditionalFonts, transformStylesheet } from '@/utils/style';
import { getBookDirFromLanguage, getBookDirFromWritingMode } from '@/utils/book';
import { useUICSS } from '@/hooks/useUICSS';
import {
  handleKeydown,
  handleMousedown,
  handleMouseup,
  handleClick,
  handleWheel,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
} from '../utils/iframeEventHandlers';
import { getMaxInlineSize } from '@/utils/config';
import { transformContent } from '@/services/transformService';

/**
 * FoliateViewer component is responsible for rendering the book content using the Foliate-JS library.
 * It handles book loading, rendering, styling, user interactions, and synchronization of reading progress.
 */
const FoliateViewer: React.FC<{
  bookKey: string;
  bookDoc: BookDoc;
  config: BookConfig;
}> = ({ bookKey, bookDoc, config }) => {
  const containerRef = useRef<HTMLDivElement>(null); // Ref to the container div for Foliate view.
  const viewRef = useRef<FoliateView | null>(null); // Ref to the Foliate view instance.
  const isViewCreated = useRef(false); // Ref to track if the Foliate view has been created.
  const { getView, setView: setFoliateView, setProgress } = useReaderStore(); // Access reader state management.
  const { getViewSettings, setViewSettings } = useReaderStore(); // Access view settings state management.
  const { getParallels } = useParallelViewStore(); // Access parallel view state management.
  const { themeCode, isDarkMode } = useThemeStore(); // Access theme state management.
  const viewSettings = getViewSettings(bookKey)!; // Get view settings for the current book.

  const [toastMessage, setToastMessage] = useState(''); // State for displaying toast messages.

  // Effect to clear toast message after 2 seconds.
  useEffect(() => {
    const timer = setTimeout(() => setToastMessage(''), 2000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Apply UI CSS, sync progress, and enable auto-saving of progress for the book.
  // These custom hooks manage various aspects of the reader's functionality.
  useUICSS(bookKey, viewSettings);
  useProgressSync(bookKey);
  useProgressAutoSave(bookKey);

  const progressRelocateHandler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    setProgress(bookKey, detail.cfi, detail.tocItem, detail.section, detail.location, detail.range);
    // Update the reading progress in the store based on the event detail.
  };

  const docTransformHandler = (event: Event) => {
    const { detail } = event as CustomEvent;
    detail.data = Promise.resolve(detail.data)
      .then((data) => {
        const viewSettings = getViewSettings(bookKey);
        if (detail.type === 'text/css') return transformStylesheet(data);
        // Apply CSS transformations if the content is CSS.
        if (viewSettings && detail.type === 'application/xhtml+xml') {
          const ctx = {
            bookKey,
            viewSettings,
            content: data,
          };
          return Promise.resolve(transformContent(ctx));
          // Transform the content of the book based on the view settings.
        }
        return data;
      })
      .catch((e) => {
        console.error(new Error(`Failed to load ${detail.name}`, { cause: e }));
        return '';
        // Handle errors during content loading or transformation.
      });
  };

  const docLoadHandler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    console.log('doc index loaded:', detail.index);
    if (detail.doc) {
      // When a document loads, adjust view settings based on its directionality.
      const writingDir = viewRef.current?.renderer.setStyles && getDirection(detail.doc);
      const viewSettings = getViewSettings(bookKey)!;
      viewSettings.vertical =
        writingDir?.vertical || viewSettings.writingMode.includes('vertical') || false;
      viewSettings.rtl = writingDir?.rtl || viewSettings.writingMode.includes('rl') || false;
      setViewSettings(bookKey, { ...viewSettings });

      mountAdditionalFonts(detail.doc);
      if (!detail.doc.isEventListenersAdded) {
        // Attach event listeners to the document once when the document is loaded.
        detail.doc.isEventListenersAdded = true;
        detail.doc.addEventListener('keydown', handleKeydown.bind(null, bookKey));
        detail.doc.addEventListener('mousedown', handleMousedown.bind(null, bookKey));
        detail.doc.addEventListener('mouseup', handleMouseup.bind(null, bookKey));
        detail.doc.addEventListener('click', handleClick.bind(null, bookKey));
        detail.doc.addEventListener('wheel', handleWheel.bind(null, bookKey));
        detail.doc.addEventListener('touchstart', handleTouchStart.bind(null, bookKey));
        detail.doc.addEventListener('touchmove', handleTouchMove.bind(null, bookKey));
        detail.doc.addEventListener('touchend', handleTouchEnd.bind(null, bookKey));
      }
    }
  };

  const docRelocateHandler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail.reason !== 'scroll' && detail.reason !== 'page') return;
    // Handle document relocation events (scrolling or pagination).
    if (detail.reason === 'scroll') {
      const renderer = viewRef.current?.renderer;
      const viewSettings = getViewSettings(bookKey)!;
      if (renderer && viewSettings.continuousScroll) {
        if (renderer.start <= 0) {
          viewRef.current?.prev(1);
          // If at the beginning of the view, move to the previous page.
          // sometimes viewSize has subpixel value that the end never reaches
        } else if (renderer.end + 1 >= renderer.viewSize) {
          viewRef.current?.next(1);
          // If at the end of the view, move to the next page.
        }
      }
    }
    const parallelViews = getParallels(bookKey);
    if (parallelViews && parallelViews.size > 0) {
      // Synchronize with parallel views if they exist.
      parallelViews.forEach((key) => {
        if (key !== bookKey) { // If the view is not the current one
          const target = getView(key)?.renderer;
          if (target) {
            target.goTo?.({ index: detail.index, anchor: detail.fraction });
          }
        }
      });
    }
  };

  useTouchEvent(bookKey, viewRef); // Enable touch event handling.
  const { handleTurnPage } = useClickEvent(bookKey, viewRef, containerRef); // Enable click event handling.

  // Attach event handlers to the Foliate view.
  useFoliateEvents(viewRef.current, {
    onLoad: docLoadHandler,
    onRelocate: progressRelocateHandler,
    onRendererRelocate: docRelocateHandler,
    // Set up event handlers for document loading and relocation.
  });

  useEffect(() => {
    if (viewRef.current && viewRef.current.renderer) {
      const viewSettings = getViewSettings(bookKey)!;
      viewRef.current.renderer.setStyles?.(getStyles(viewSettings));
    }
    // Reapply styles when the theme or dark mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeCode, isDarkMode]);

  // Initialize the Foliate view when the component mounts.
  useEffect(() => {
    if (isViewCreated.current) return; // Prevent multiple initializations.
    isViewCreated.current = true; // Mark the view as created.

    const openBook = async () => {
      console.log('Opening book', bookKey);
      await import('foliate-js/view.js');
      const view = wrappedFoliateView(document.createElement('foliate-view') as FoliateView);
      view.id = `foliate-view-${bookKey}`;
      document.body.append(view);
      containerRef.current?.appendChild(view);
      // Create a new Foliate view and append it to the DOM.

      const writingMode = viewSettings.writingMode;
      if (writingMode) {
        const settingsDir = getBookDirFromWritingMode(writingMode);
        const languageDir = getBookDirFromLanguage(bookDoc.metadata.language);
        if (settingsDir !== 'auto') {
          bookDoc.dir = settingsDir;
        } else if (languageDir !== 'auto') {
          bookDoc.dir = languageDir;
        }
      }

      await view.open(bookDoc); // Open the book in the Foliate view.
      // make sure we can listen renderer events after opening book
      viewRef.current = view;
      setFoliateView(bookKey, view);

      const { book } = view;

      book.transformTarget?.addEventListener('data', docTransformHandler); // Listen for data transformation events.
      // Set initial styles and attributes for the Foliate renderer.
      view.renderer.setStyles?.(getStyles(viewSettings));

      const isScrolled = viewSettings.scrolled!;
      const marginPx = viewSettings.marginPx!;
      const gapPercent = viewSettings.gapPercent!;
      const animated = viewSettings.animated!;
      const maxColumnCount = viewSettings.maxColumnCount!;
      const maxInlineSize = getMaxInlineSize(viewSettings);
      // Get maximum inline size based on current view settings.
      const maxBlockSize = viewSettings.maxBlockSize!;
      if (animated) {
        view.renderer.setAttribute('animated', '');
      } else {
        view.renderer.removeAttribute('animated');
      }
      view.renderer.setAttribute('flow', isScrolled ? 'scrolled' : 'paginated');
      view.renderer.setAttribute('margin', `${marginPx}px`);
      view.renderer.setAttribute('gap', `${gapPercent}%`);
      view.renderer.setAttribute('max-column-count', maxColumnCount);
      view.renderer.setAttribute('max-inline-size', `${maxInlineSize}px`);
      view.renderer.setAttribute('max-block-size', `${maxBlockSize}px`);

      const lastLocation = config.location;
      if (lastLocation) {
        await view.init({ lastLocation });
      } else {
        // Initialize the view with the last location or start at the beginning.
        await view.goToFraction(0);
      }
    };

    openBook(); // Call the function to open the book.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        className='foliate-viewer h-[100%] w-[100%]' // Set the dimensions of the viewer.
        onClick={(event) => handleTurnPage(event)}
        ref={containerRef} // Attach the container ref to the div.
      />
    </> // Render the Foliate viewer container.
  );
};

export default FoliateViewer;
