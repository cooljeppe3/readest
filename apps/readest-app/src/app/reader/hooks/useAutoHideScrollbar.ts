import { getOSPlatform } from '@/utils/misc';

/**
 * Custom hook for auto-hiding scrollbars in specific operating systems.
 *
 * This hook manages the visibility of scrollbars within an iframe container.
 * It is designed to auto-hide the scrollbars on macOS and iOS but show them on scroll,
 * providing a cleaner user interface.
 *
 * NOTE: Be careful when using this hook. In macOS, if the scrollbar is set to always be visible,
 * hiding it may alter the layout. Ensure that this hook is only used in widgets with constrained dimensions.
 * See https://github.com/readest/readest/issues/600 for more details.
 */
export const useAutoHideScrollbar = () => {
  // Determine if scrollbars should be auto-hidden based on the operating system.
  const shouldAutoHideScrollbar = ['macos', 'ios'].includes(getOSPlatform());

  // Function to handle the auto-hiding behavior of the scrollbar.
  const handleScrollbarAutoHide = (doc: Document) => {
    // Check if the document, its default view, and frame element are present.
    if (doc && doc.defaultView && doc.defaultView.frameElement) {
      const iframe = doc.defaultView.frameElement as HTMLIFrameElement;
      const container = iframe.parentElement?.parentElement;
      if (!container) return; // Exit if the container is not found.

      let hideScrollbarTimeout: ReturnType<typeof setTimeout>;
      const showScrollbar = () => {
        container.style.overflow = 'auto'; // Make the scrollbar visible.
        container.style.scrollbarWidth = 'thin';
      };
      // Function to hide the scrollbar.
      const hideScrollbar = () => {
        container.style.overflow = 'hidden';
        container.style.scrollbarWidth = 'none';
        requestAnimationFrame(() => {
          container.style.overflow = 'auto';
        });
      };
      // Event listener for the 'scroll' event on the container.
      container.addEventListener('scroll', () => {
        // Show the scrollbar when scrolling starts.
        showScrollbar();
        // Clear any existing timeout for hiding the scrollbar.
        clearTimeout(hideScrollbarTimeout);
        // Set a timeout to hide the scrollbar after 1 second of inactivity.
        hideScrollbarTimeout = setTimeout(hideScrollbar, 1000);
      });
      hideScrollbar(); // Initially hide the scrollbar.
    }
  };

  // Return the flag indicating whether to auto-hide scrollbars and the function to handle the auto-hiding.
  return { shouldAutoHideScrollbar, handleScrollbarAutoHide };
};
