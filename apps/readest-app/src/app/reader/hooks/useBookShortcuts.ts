// Import necessary hooks and utilities from their respective modules.
import { useReaderStore } from '@/store/readerStore';
import { useNotebookStore } from '@/store/notebookStore';
import { isTauriAppPlatform } from '@/services/environment';
import useShortcuts from '@/hooks/useShortcuts';
import useBooksManager from './useBooksManager';
import { useSidebarStore } from '@/store/sidebarStore';
import { useSettingsStore } from '@/store/settingsStore'; // Provides settings management functionality.
import { getStyles } from '@/utils/style';
import { tauriQuitApp } from '@/utils/window';
import { eventDispatcher } from '@/utils/event';
import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL, ZOOM_STEP } from '@/services/constants';

// Interface to define the props for the useBookShortcuts hook.
interface UseBookShortcutsProps {
  sideBarBookKey: string | null; // Key for the currently selected book in the sidebar.
  bookKeys: string[]; // An array of keys representing all available books.
}

// The main hook definition. It takes props from the UseBookShortcutsProps interface.
const useBookShortcuts = ({ sideBarBookKey, bookKeys }: UseBookShortcutsProps) => {
  // Accessing state management stores using custom hooks.
  // `useReaderStore`: Manages the state related to the reader view.
  const { getView, getViewSettings, setViewSettings } = useReaderStore();
  // `useSidebarStore`: Manages the state of the sidebar.
  const { toggleSideBar, setSideBarBookKey } = useSidebarStore();
  // `useSettingsStore`: Manages application settings.
  const { setFontLayoutSettingsDialogOpen } = useSettingsStore();
  // `useNotebookStore`: Manages the state related to the notebook feature.
  const { toggleNotebook } = useNotebookStore();
  // `useBooksManager`: Manages operations related to books.
  const { getNextBookKey } = useBooksManager();
  // Retrieve view settings for the current book.
  const viewSettings = getViewSettings(sideBarBookKey ?? '');
  // Default font size and line height from the view settings.
  const fontSize = viewSettings?.defaultFontSize ?? 16;
  const lineHeight = viewSettings?.lineHeight ?? 1.6;
  // Calculate the distance for scrolling operations based on font size and line height.
  const distance = fontSize * lineHeight * 3;

  // Function to toggle between scroll mode and paginated mode.
  const toggleScrollMode = () => {
    // Retrieve the current view settings.
    const viewSettings = getViewSettings(sideBarBookKey ?? '');
    if (viewSettings && sideBarBookKey) {
      // Toggle the 'scrolled' property.
      viewSettings.scrolled = !viewSettings.scrolled;
      // Update the view settings in the store.
      setViewSettings(sideBarBookKey, viewSettings!);
      // Determine the flow mode based on whether scrolling is enabled or not.
      const flowMode = viewSettings.scrolled ? 'scrolled' : 'paginated';
      // Set the flow mode on the renderer for the current book view.
      getView(sideBarBookKey)?.renderer.setAttribute('flow', flowMode);
    }
  };

  // Function to switch the currently selected book in the sidebar.
  const switchSideBar = () => {
    // If there is a currently selected book, switch to the next book.
    if (sideBarBookKey) setSideBarBookKey(getNextBookKey(sideBarBookKey));
  };

  // Function to navigate left in the current view.
  const goLeft = () => {
    getView(sideBarBookKey)?.goLeft();
  };

  // Function to navigate right in the current view.
  const goRight = () => {
    getView(sideBarBookKey)?.goRight();
  };

  // Function to scroll up by a certain distance.
  const goPrev = () => {
    getView(sideBarBookKey)?.prev(distance);
  };

  const goNext = () => {
    getView(sideBarBookKey)?.next(distance);
  };

  // Function to navigate back in the view's history.
  const goBack = () => {
    getView(sideBarBookKey)?.history.back();
  };

  // Function to scroll down by half the page height.
  const goHalfPageDown = () => {
    const view = getView(sideBarBookKey);
    const viewSettings = getViewSettings(sideBarBookKey ?? '');
    if (view && viewSettings && viewSettings.scrolled) {
      view.next(view.renderer.size / 2);
    }
  };

  // Function to scroll up by half the page height.
  const goHalfPageUp = () => {
    const view = getView(sideBarBookKey);
    const viewSettings = getViewSettings(sideBarBookKey ?? '');
    if (view && viewSettings && viewSettings.scrolled) {
      view.prev(view.renderer.size / 2);
    }
  };

  // Function to navigate forward in the view's history.
  const goForward = () => {
    getView(sideBarBookKey)?.history.forward();
  };

  // Function to reload the current page.
  const reloadPage = () => {
    window.location.reload();
  };

  // Function to quit the application, checking if it's running in a Tauri environment.
  const quitApp = async () => {
    // on web platform use browser's default shortcut to close the tab
    if (isTauriAppPlatform()) {
      await tauriQuitApp();
    }
  };

  // Function to show the search bar, dispatching an event.
  const showSearchBar = () => {
    eventDispatcher.dispatch('search', { term: '' });
  };

  // Function to zoom in on the current view.
  const zoomIn = () => {
    // Check for valid state before proceeding.
    if (!sideBarBookKey) return;
    const view = getView(sideBarBookKey);
    if (!view?.renderer?.setStyles) return;
    const viewSettings = getViewSettings(sideBarBookKey)!;
    const zoomLevel = viewSettings!.zoomLevel + ZOOM_STEP;
    viewSettings!.zoomLevel = Math.min(zoomLevel, MAX_ZOOM_LEVEL);
    setViewSettings(sideBarBookKey, viewSettings!);
    view?.renderer.setStyles?.(getStyles(viewSettings!));
  };

  // Function to zoom out on the current view.
  const zoomOut = () => {
    if (!sideBarBookKey) return;
    const view = getView(sideBarBookKey);
    if (!view?.renderer?.setStyles) return;
    const viewSettings = getViewSettings(sideBarBookKey)!;
    const zoomLevel = viewSettings!.zoomLevel - ZOOM_STEP;
    viewSettings!.zoomLevel = Math.max(zoomLevel, MIN_ZOOM_LEVEL);
    setViewSettings(sideBarBookKey, viewSettings!);
    view?.renderer.setStyles?.(getStyles(viewSettings!));
  };

  // Function to reset the zoom level to default.
  const resetZoom = () => {
    if (!sideBarBookKey) return;
    const view = getView(sideBarBookKey);
    if (!view?.renderer?.setStyles) return;
    const viewSettings = getViewSettings(sideBarBookKey)!;
    viewSettings!.zoomLevel = 100;
    setViewSettings(sideBarBookKey, viewSettings!);
    view?.renderer.setStyles?.(getStyles(viewSettings!));
  };

  // Hook to set up shortcuts, passing in the relevant handler functions.
  useShortcuts(
    {
      onSwitchSideBar: switchSideBar,
      onToggleSideBar: toggleSideBar,
      onToggleNotebook: toggleNotebook,
      onToggleScrollMode: toggleScrollMode,
      onOpenFontLayoutSettings: () => setFontLayoutSettingsDialogOpen(true),
      onToggleSearchBar: showSearchBar,
      onReloadPage: reloadPage,
      onQuitApp: quitApp,
      onGoLeft: goLeft,
      onGoRight: goRight,
      onGoPrev: goPrev,
      onGoNext: goNext,
      onGoHalfPageDown: goHalfPageDown,
      onGoHalfPageUp: goHalfPageUp,
      onGoBack: goBack,
      onGoForward: goForward,
      onZoomIn: zoomIn,
      onZoomOut: zoomOut,
      onResetZoom: resetZoom,
    },
    [sideBarBookKey, bookKeys],
  );
};

// Export the hook to be used in other parts of the application.
export default useBookShortcuts;
