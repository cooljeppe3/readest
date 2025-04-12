import { ViewSettings } from '@/types/book';
import { useEffect, useState } from 'react';

/**
 * useUICSS Hook
 *
 * This hook allows injecting custom CSS into the reader UI (User Interface).
 * It's important to note that the book's content is rendered inside an iframe.
 * Therefore, CSS injected via this hook will only affect the reader UI and not the book content.
 *
 * @param {string} bookKey - A unique identifier for the book. This is used to scope the CSS to a specific book's UI.
 * @param {ViewSettings} viewSettings - An object containing the user's view settings, including any custom stylesheet.
 */
export const useUICSS = (bookKey: string, viewSettings: ViewSettings) => {
  // State to keep track of the <style> element added to the document head.
  const [styleElement, setStyleElement] = useState<HTMLStyleElement | null>(null);

  // useEffect hook to handle the creation and removal of the style element.
  useEffect(() => {
    // If viewSettings is not provided, do nothing.
    if (!viewSettings) return;
    // If there's an existing style element, remove it to prevent conflicts.
    if (styleElement) {
      styleElement.remove();
    }

    // Get the raw CSS from the viewSettings, or use an empty string if it's not provided.
    const rawCSS = viewSettings.userStylesheet || '';
    // Create a new <style> element to add to the document head.
    const newStyleEl = document.createElement('style');
    // Replace 'foliate-view' with a scoped selector specific to the current book.
    // This ensures that the custom CSS only applies to the intended book's UI.
    newStyleEl.textContent = rawCSS.replace('foliate-view', `#foliate-view-${bookKey}`);
    // Append the new <style> element to the <head> of the document.
    document.head.appendChild(newStyleEl);
    // Update the state to keep track of the new style element.
    setStyleElement(newStyleEl);

    // Cleanup function: remove the style element when the component unmounts or the dependencies change.
    return () => {
      newStyleEl.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewSettings]); // Re-run the effect when viewSettings changes.
};
