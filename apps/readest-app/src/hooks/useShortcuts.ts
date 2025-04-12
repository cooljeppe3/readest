import { useEffect, useState } from 'react';
import { loadShortcuts, ShortcutConfig } from '../helpers/shortcuts';

// Define a type for the key action handlers.
// It's a map where keys are from ShortcutConfig and values are functions to be executed.
export type KeyActionHandlers = {
  [K in keyof ShortcutConfig]?: () => void;
};

// useShortcuts hook manages global keyboard shortcuts.
const useShortcuts = (actions: KeyActionHandlers, dependencies: React.DependencyList = []) => {
  // State to store the current shortcut configuration.
  // Initially loads shortcuts from local storage or default settings.
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(loadShortcuts);

  // useEffect to handle shortcut updates.
  useEffect(() => {
    // Function to update the shortcut state.
    const handleShortcutUpdate = () => {
      // Reloads shortcuts from storage and updates the state.
      setShortcuts(loadShortcuts());
    };

    // Listen for custom event 'shortcutUpdate' to refresh shortcuts.
    window.addEventListener('shortcutUpdate', handleShortcutUpdate);
    // Cleanup: remove the event listener when the component unmounts.
    return () => window.removeEventListener('shortcutUpdate', handleShortcutUpdate);
  }, []);

  // Function to parse a shortcut string into its constituent parts.
  // Example: "ctrl+shift+a" becomes { ctrlKey: true, shiftKey: true, key: "a" }.
  const parseShortcut = (shortcut: string) => {
    // Convert to lowercase and split by '+' to handle modifiers and key.
    const keys = shortcut.toLowerCase().split('+');
    // Return an object representing the state of each modifier and the key.
    return {
      // Check if 'ctrl' is part of the shortcut.
      ctrlKey: keys.includes('ctrl'),
      // Check if 'alt' or 'opt' is present (handles different keyboard layouts).
      altKey: keys.includes('alt') || keys.includes('opt'),
      // Check if 'meta' or 'cmd' is present (handles different OS keys).
      metaKey: keys.includes('meta') || keys.includes('cmd'),
      // Check if 'shift' is present.
      shiftKey: keys.includes('shift'),
      // Extract the actual key (not a modifier) from the shortcut.
      key: keys.find((k) => !['ctrl', 'alt', 'opt', 'meta', 'cmd', 'shift'].includes(k)),
    };
  };

  const isShortcutMatch = (
    shortcut: string,
    key: string,
    ctrlKey: boolean,
    altKey: boolean,
    metaKey: boolean,
    shiftKey: boolean,
  ) => {
    // Parse the stored shortcut.
    const parsedShortcut = parseShortcut(shortcut);
    return (
      parsedShortcut.key === key.toLowerCase() &&
      parsedShortcut.ctrlKey === ctrlKey &&
      parsedShortcut.altKey === altKey &&
      parsedShortcut.metaKey === metaKey &&
      parsedShortcut.shiftKey === shiftKey
    );
  };

  // Process a key event to check if it matches any registered shortcut.
  const processKeyEvent = (
    key: string,
    ctrlKey: boolean,
    altKey: boolean,
    metaKey: boolean,
    shiftKey: boolean,
  ): boolean => {
    // FIXME: This is a temporary fix to disable Back button navigation.
    if (key === 'backspace') return true;
    // Iterate through each action in the actions map.
    for (const [actionName, actionHandler] of Object.entries(actions)) {
      // actionName corresponds to a shortcut key in ShortcutConfig
      const shortcutKey = actionName as keyof ShortcutConfig;
      // Extract the function for the current action.
      const handler = actionHandler as (() => void) | undefined;
      // Get the list of shortcuts associated with the current action.
      const shortcutList = shortcuts[shortcutKey as keyof ShortcutConfig];
      // Check if there's a handler and if any registered shortcut matches the pressed key event.
      if (
        handler &&
        shortcutList?.some((shortcut) =>
          isShortcutMatch(shortcut, key, ctrlKey, altKey, metaKey, shiftKey),
        )
      ) {
        // If a shortcut matches and has a handler, execute it.
        handler();
        // Indicate that the key event has been handled.
        return true;
      }
    }
    // Indicate that no shortcut has been matched.
    return false;
  };

  // Main event handler for keyboard events.
  const unifiedHandleKeyDown = (event: KeyboardEvent | MessageEvent) => {
    // Check if the focus is on an input, textarea, or contenteditable element
    const activeElement = document.activeElement as HTMLElement;
    const isInteractiveElement =
      (activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable);

    // Check if the focused element is a note editor (textarea with class 'note-editor').
    const isNoteEditor = (activeElement.tagName === 'TEXTAREA' && activeElement.classList.contains('note-editor'))

    // If the user is typing in an input, textarea or contenteditable that is not a note editor, skip handling.
    if (isInteractiveElement && !isNoteEditor) {
      return;
    }

    // Handle a normal keyboard event.
    if (event instanceof KeyboardEvent) {
      // Extract key and modifier information.
      const { key, ctrlKey, altKey, metaKey, shiftKey } = event;
      // Handle NoteEditor exceptions.
      // If is a note editor, skip handling if it's not Ctrl+Enter or Escape.
      if (isNoteEditor && !((key === "Enter" && ctrlKey) || (key == "Escape"))) {
        return;
      }
      // Process the key event and check if a shortcut was handled.
      const handled = processKeyEvent(key.toLowerCase(), ctrlKey, altKey, metaKey, shiftKey);
      // If the key event was handled, prevent the default action.
      if (handled) event.preventDefault();
      // Handle the event from an iframe.
    } else if (
      event instanceof MessageEvent &&
      event.data &&
      event.data.type === 'iframe-keydown'
    ) {
      // Extract key and modifier information from the iframe's message.
      const { key, ctrlKey, altKey, metaKey, shiftKey } = event.data;
      processKeyEvent(key.toLowerCase(), ctrlKey, altKey, metaKey, shiftKey);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', unifiedHandleKeyDown);
    window.addEventListener('message', unifiedHandleKeyDown);

    return () => {
      window.removeEventListener('keydown', unifiedHandleKeyDown);
      window.removeEventListener('message', unifiedHandleKeyDown);
    };
    // re-run when shortcuts or dependencies changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcuts, ...dependencies]);
};

export default useShortcuts;
