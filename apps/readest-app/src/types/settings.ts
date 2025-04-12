import { CustomTheme } from '@/styles/themes';
import { HighlightColor, HighlightStyle, ViewSettings } from './book';

// Represents the possible theme types.
export type ThemeType = 'light' | 'dark' | 'auto';

// Interface for reader-specific settings.
export interface ReadSettings {
  // Width of the sidebar in a string format (e.g., "300px").
  sideBarWidth: string;
  // Indicates if the sidebar is pinned (always visible).
  isSideBarPinned: boolean;
  // Width of the notebook in a string format (e.g., "400px").
  notebookWidth: string;
  // Indicates if the notebook is pinned (always visible).
  isNotebookPinned: boolean;
  // If true, the cursor will be hidden after a period of inactivity.
  autohideCursor: boolean;
  // The target language code for translation (e.g., "en" for English, "zh" for Chinese).
  translateTargetLang: string;

  // The current highlight style selected by the user.
  highlightStyle: HighlightStyle;
  // A record mapping each highlight style to its corresponding color.
  highlightStyles: Record<HighlightStyle, HighlightColor>;
  // An array of custom themes defined by the user.
  customThemes: CustomTheme[];
}

// Interface for system-wide application settings.
export interface SystemSettings {
  // Current version of the application.
  version: number;
  // Directory path for locally stored books.
  localBooksDir: string;

  // If true, the user will stay logged in across sessions.
  keepLogin: boolean;
  // If true, data will be automatically uploaded to cloud storage.
  autoUpload: boolean;
  // If true, the application will always be visible on top of other windows.
  alwaysOnTop: boolean;
  // If true, the application will automatically check for updates.
  autoCheckUpdates: boolean;
  // If true, the application will prevent the screen from dimming or turning off.
  screenWakeLock: boolean;
  // If true, books will be automatically imported upon application launch.
  autoImportBooksOnOpen: boolean;

  // Timestamp of the last successful sync with books data.
  lastSyncedAtBooks: number;
  // Timestamp of the last successful sync with configuration data.
  lastSyncedAtConfigs: number;
  // Timestamp of the last successful sync with notes data.
  lastSyncedAtNotes: number;

  /**
   * Global reader settings that apply to all books.
   * These settings will be applied to each book unless overridden by book-specific settings.
   */
  globalReadSettings: ReadSettings;
  /**
   * Global view settings that apply to all views.
   * These settings will be applied to each view unless overridden by view-specific settings.
   */
  globalViewSettings: ViewSettings;
}
