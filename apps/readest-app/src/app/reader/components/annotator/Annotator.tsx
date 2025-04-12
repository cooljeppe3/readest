// Import necessary React hooks and components
import React, { useState, useEffect, useRef } from 'react';
// Import icons from react-icons library
import { FiSearch } from 'react-icons/fi';
import { FiCopy } from 'react-icons/fi';
import { PiHighlighterFill } from 'react-icons/pi';
import { FaWikipediaW } from 'react-icons/fa';
import { BsPencilSquare } from 'react-icons/bs';
import { RiDeleteBinLine } from 'react-icons/ri';
import { BsTranslate } from 'react-icons/bs'; // Translation icon
import { TbHexagonLetterD } from 'react-icons/tb';
import { FaHeadphones } from 'react-icons/fa6';

// Import CFI (Content Fragment Identifier) from foliate-js for precise content location
import * as CFI from 'foliate-js/epubcfi.js';
// Import Overlayer from foliate-js for annotation drawing
import { Overlayer } from 'foliate-js/overlayer.js';
// Import context and types from project files
import { useEnv } from '@/context/EnvContext';
import { BookNote, BooknoteGroup, HighlightColor, HighlightStyle } from '@/types/book';
// Import utility functions
import { getOSPlatform, uniqueId } from '@/utils/misc';
// Import stores
import { useBookDataStore } from '@/store/bookDataStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useReaderStore } from '@/store/readerStore';
import { useNotebookStore } from '@/store/notebookStore';
// Import hooks
import { useTranslation } from '@/hooks/useTranslation';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { useFoliateEvents } from '../../hooks/useFoliateEvents';
import { useNotesSync } from '../../hooks/useNotesSync';
// Import utility functions and constants for text selection, event dispatching, and table of contents
import { getPopupPosition, getPosition, Position, TextSelection } from '@/utils/sel';
import { eventDispatcher } from '@/utils/event';
import { findTocItemBS } from '@/utils/toc';
import { HIGHLIGHT_COLOR_HEX } from '@/services/constants';
// Import popup components for different annotation actions
import AnnotationPopup from './AnnotationPopup';
import WiktionaryPopup from './WiktionaryPopup';
import WikipediaPopup from './WikipediaPopup';
import DeepLPopup from './DeepLPopup';

// Annotator component: Main component for handling text selection and annotations

const Annotator: React.FC<{ bookKey: string }> = ({ bookKey }) => {
  // Use translation hook for internationalization
  const _ = useTranslation();

  // Access environment configuration and application services
  const { envConfig, appService } = useEnv();
  // Access settings from the settings store
  const { settings } = useSettingsStore();
  const { getConfig, saveConfig, getBookData, updateBooknotes } = useBookDataStore();
  const { getProgress, getView, getViewsById, getViewSettings } = useReaderStore();
  const { setNotebookVisible, setNotebookNewAnnotation } = useNotebookStore();

  useNotesSync(bookKey);

  // Get the operating system platform and book-specific data
  const osPlatform = getOSPlatform();
  const config = getConfig(bookKey)!;
  const progress = getProgress(bookKey)!;
  const bookData = getBookData(bookKey)!;
  const view = getView(bookKey);
  const viewSettings = getViewSettings(bookKey)!;

  // State variables for handling popups and selection states
  const isShowingPopup = useRef(false);
  const isTextSelected = useRef(false);
  const isUpToShowPopup = useRef(false);
  const isTouchstarted = useRef(false);
  const [selection, setSelection] = useState<TextSelection | null>();

  // State variables for controlling popup visibility
  const [showAnnotPopup, setShowAnnotPopup] = useState(false);
  const [showWiktionaryPopup, setShowWiktionaryPopup] = useState(false);
  const [showWikipediaPopup, setShowWikipediaPopup] = useState(false);
  const [showDeepLPopup, setShowDeepLPopup] = useState(false);
  // State variables for popup positions
  const [trianglePosition, setTrianglePosition] = useState<Position>();

  const [annotPopupPosition, setAnnotPopupPosition] = useState<Position>();
  const [dictPopupPosition, setDictPopupPosition] = useState<Position>();
  const [translatorPopupPosition, setTranslatorPopupPosition] = useState<Position>();
  const [highlightOptionsVisible, setHighlightOptionsVisible] = useState(false);

  const [selectedStyle, setSelectedStyle] = useState<HighlightStyle>(
    settings.globalReadSettings.highlightStyle,
  );
  const [selectedColor, setSelectedColor] = useState<HighlightColor>(
    settings.globalReadSettings.highlightStyles[selectedStyle],
  );

  // Calculate responsive sizes and dimensions for popups
  const popupPadding = useResponsiveSize(10);
  const maxWidth = window.innerWidth - 2 * popupPadding;
  const maxHeight = window.innerHeight - 2 * popupPadding;
  const dictPopupWidth = Math.min(480, maxWidth);

  const dictPopupHeight = Math.min(300, maxHeight);
  const transPopupWidth = Math.min(480, maxWidth);
  const transPopupHeight = Math.min(360, maxHeight);
  const annotPopupWidth = Math.min(useResponsiveSize(300), maxWidth);
  const annotPopupHeight = useResponsiveSize(44);
  const androidSelectionHandlerHeight = 0;

  // Event handler for when the iframe content is loaded
  const onLoad = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    const { doc, index } = detail;

     // Check if a text selection is valid
    const isValidSelection = (sel: Selection) => {
      return sel && sel.toString().trim().length > 0 && sel.rangeCount > 0;
    };
    // Create a new selection object
    const makeSelection = (sel: Selection, rebuildRange = false) => {
      isTextSelected.current = true;
      const range = sel.getRangeAt(0);
      if (rebuildRange) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      setSelection({ key: bookKey, text: sel.toString(), range, index });
    };
    // Special handling for text selection on iOS
    // FIXME: extremely hacky way to dismiss system selection tools on iOS
    const makeSelectionOnIOS = (sel: Selection) => {
      isTextSelected.current = true;
      const range = sel.getRangeAt(0);
      setTimeout(() => {
        sel.removeAllRanges();
        setTimeout(() => {
          if (!isTextSelected.current) return;
          sel.addRange(range);
          setSelection({ key: bookKey, text: range.toString(), range, index });
        }, 40);
      }, 0);
    };
    // Handle selection change event
    const handleSelectionchange = () => {
      // Available on iOS, Android and Desktop, fired when the selection is changed
      // Ideally the popup only shows when the selection is done,
      // but on Android no proper events are fired to notify selection done or I didn't find it,
      // we make the popup show when the selection is changed
      if (osPlatform === 'ios' || appService?.isIOSApp) return;

      const sel = doc.getSelection();
      if (isValidSelection(sel)) {
        if (osPlatform === 'android' && isTouchstarted.current) {
          makeSelection(sel, false);
        }
      } else if (!isUpToShowPopup.current) {
        isTextSelected.current = false;
        setShowAnnotPopup(false);
        setShowWiktionaryPopup(false);
        setShowWikipediaPopup(false);
        setShowDeepLPopup(false);
      }
    };
    // Handle pointer up event
    const handlePointerup = () => {
      // Available on iOS and Desktop, fired when release the long press
      // Note that on Android, pointerup event is fired after an additional touch event
      const sel = doc.getSelection();
      if (isValidSelection(sel)) {
        if (osPlatform === 'ios' || appService?.isIOSApp) {
          makeSelectionOnIOS(sel);
        } else {
          makeSelection(sel, true);
        }
      }
    };
     // Handle touch start event
    const handleTouchstart = () => {
      // Available on iOS and Android for the initial touch event
      isTouchstarted.current = true;
    };
    // Handle touch move event
    const handleTouchmove = () => {
      // Available on iOS, on Android not fired
      // To make the popup not to follow the selection
      setShowAnnotPopup(false);
    };
    // Handle touch end event
    const handleTouchend = () => {
      // Available on iOS, on Android fired after an additional touch event
      isTouchstarted.current = false;
    };
    if (bookData.book?.format !== 'PDF') {
      detail.doc?.addEventListener('pointerup', handlePointerup);
      detail.doc?.addEventListener('touchstart', handleTouchstart);
      detail.doc?.addEventListener('touchmove', handleTouchmove);
      detail.doc?.addEventListener('touchend', handleTouchend);
      detail.doc?.addEventListener('selectionchange', handleSelectionchange);

      // Disable the default context menu on mobile devices,
      // although it should but doesn't work on iOS
      if (appService?.isMobile) {
        detail.doc?.addEventListener('contextmenu', (event: Event) => {
          event.preventDefault();
          event.stopPropagation();
          return false;
        });
      }
    }
  };

  // Event handler for drawing annotations
  const onDrawAnnotation = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    const { draw, annotation, doc, range } = detail;
    const { style, color } = annotation as BookNote;
    const hexColor = color ? HIGHLIGHT_COLOR_HEX[color] : color;
    if (style === 'highlight') {
      draw(Overlayer.highlight, { color: hexColor });
    } else if (['underline', 'squiggly'].includes(style as string)) {
      const { defaultView } = doc;
      const node = range.startContainer;
      const el = node.nodeType === 1 ? node : node.parentElement;
      const { writingMode } = defaultView.getComputedStyle(el);
      draw(Overlayer[style as keyof typeof Overlayer], { writingMode, color: hexColor });
    }
  };

  // Event handler for showing existing annotations
  const onShowAnnotation = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    const { value: cfi, index, range } = detail;
    const { booknotes = [] } = getConfig(bookKey)!;
    const annotations = booknotes.filter(
      (booknote) => booknote.type === 'annotation' && !booknote.deletedAt,
    );
    const annotation = annotations.find((annotation) => annotation.cfi === cfi);
    if (!annotation) return;
    const selection = { key: bookKey, annotated: true, text: annotation.text ?? '', range, index };
    isUpToShowPopup.current = true;
    setSelectedStyle(annotation.style!);
    setSelectedColor(annotation.color!);
    setSelection(selection);
  };

   // Use Foliate events hook for managing custom events from Foliate
  useFoliateEvents(view, { onLoad, onDrawAnnotation, onShowAnnotation });

  const handleDismissPopup = () => {
    setSelection(null);
    setShowAnnotPopup(false);
    setShowWiktionaryPopup(false);

    setShowWikipediaPopup(false);
    setShowDeepLPopup(false);
    isShowingPopup.current = false;
  };

  const handleDismissPopupAndSelection = () => {
    handleDismissPopup();
    view?.deselect();
    isTextSelected.current = false;
  };

  // Effect to handle single clicks and export annotations
  useEffect(() => {
    const handleSingleClick = (): boolean => {
      if (isUpToShowPopup.current) {
        isUpToShowPopup.current = false;
        return true;
      }
      if (isTextSelected.current) {
        handleDismissPopupAndSelection();
        return true;
      }
      if (showAnnotPopup || isShowingPopup.current) {
        handleDismissPopup();
        return true;
      }
      return false;
    };

    eventDispatcher.onSync('iframe-single-click', handleSingleClick);
    eventDispatcher.on('export-annotations', handleExportMarkdown);
    return () => {
      eventDispatcher.offSync('iframe-single-click', handleSingleClick);
      eventDispatcher.off('export-annotations', handleExportMarkdown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

   // Effect to handle text selection changes and position popups
  useEffect(() => {
    setHighlightOptionsVisible(!!(selection && selection.annotated));
    if (selection && selection.text.trim().length > 0) {
      const gridFrame = document.querySelector(`#gridcell-${bookKey}`);
      if (!gridFrame) return;
      const rect = gridFrame.getBoundingClientRect();
      const triangPos = getPosition(selection.range, rect, popupPadding, viewSettings.vertical);
      const annotPopupPos = getPopupPosition(
        triangPos,
        rect,
        viewSettings.vertical ? annotPopupHeight : annotPopupWidth,
        viewSettings.vertical ? annotPopupWidth : annotPopupHeight,
        popupPadding,
      );
      if (isTextSelected.current && annotPopupPos.dir === 'down' && osPlatform === 'android') {
        triangPos.point.y += androidSelectionHandlerHeight;
        annotPopupPos.point.y += androidSelectionHandlerHeight;
      }
      const dictPopupPos = getPopupPosition(
        triangPos,
        rect,
        dictPopupWidth,
        dictPopupHeight,
        popupPadding,
      );
      const transPopupPos = getPopupPosition(
        triangPos,
        rect,
        transPopupWidth,
        transPopupHeight,
        popupPadding,
      );
      if (triangPos.point.x == 0 || triangPos.point.y == 0) return;
      setShowAnnotPopup(true);
      setAnnotPopupPosition(annotPopupPos);
      setDictPopupPosition(dictPopupPos);
      setTranslatorPopupPosition(transPopupPos);
      setTrianglePosition(triangPos);
      isShowingPopup.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, bookKey]);

  // Effect to add existing annotations to the view when progress changes
  useEffect(() => {
    if (!progress) return;
    const { location } = progress;
    const start = CFI.collapse(location);
    const end = CFI.collapse(location, true);
    const { booknotes = [] } = config;
    const annotations = booknotes.filter(
      (item) =>
        !item.deletedAt &&
        item.type === 'annotation' &&
        item.style &&
        CFI.compare(item.cfi, start) >= 0 &&
        CFI.compare(item.cfi, end) <= 0,
    );
    try {
      Promise.all(annotations.map((annotation) => view?.addAnnotation(annotation)));
    } catch (e) {
      console.error(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

   // Function to handle text copying
  const handleCopy = () => {
    if (!selection || !selection.text) return;
    eventDispatcher.dispatch('toast', {
      type: 'info',
      message: _('Copied to notebook'),
      className: 'whitespace-nowrap',
      timeout: 2000,
    });

    const { booknotes: annotations = [] } = config;
    if (selection) navigator.clipboard?.writeText(selection.text);
    const cfi = view?.getCFI(selection.index, selection.range);
    if (!cfi) return;
    const annotation: BookNote = {
      id: uniqueId(),
      type: 'excerpt',
      cfi,
      text: selection.text,
      note: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const existingIndex = annotations.findIndex(
      (annotation) =>
        annotation.cfi === cfi && annotation.type === 'excerpt' && !annotation.deletedAt,
    );
    if (existingIndex !== -1) {
      annotations[existingIndex] = annotation;
    } else {
      annotations.push(annotation);
    }
    const updatedConfig = updateBooknotes(bookKey, annotations);
    if (updatedConfig) {
      saveConfig(envConfig, bookKey, updatedConfig, settings);
    }
    handleDismissPopupAndSelection();
    if (!appService?.isMobile) {
      setNotebookVisible(true);
    }
  };

  // Function to handle text highlighting
  const handleHighlight = (update = false) => {
    if (!selection || !selection.text) return;
    setHighlightOptionsVisible(true);
    const { booknotes: annotations = [] } = config;
    const cfi = view?.getCFI(selection.index, selection.range);
    if (!cfi) return;
    const style = settings.globalReadSettings.highlightStyle;
    const color = settings.globalReadSettings.highlightStyles[style];
    const annotation: BookNote = {
      id: uniqueId(),
      type: 'annotation',
      cfi,
      style,
      color,
      text: selection.text,
      note: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const existingIndex = annotations.findIndex(
      (annotation) =>
        annotation.cfi === cfi && annotation.type === 'annotation' && !annotation.deletedAt,
    );
    const views = getViewsById(bookKey.split('-')[0]!);
    if (existingIndex !== -1) {
      views.forEach((view) => view?.addAnnotation(annotation, true));
      if (update) {
        annotation.id = annotations[existingIndex]!.id;
        annotations[existingIndex] = annotation;
        views.forEach((view) => view?.addAnnotation(annotation));
      } else {
        annotations[existingIndex]!.deletedAt = Date.now();
        setShowAnnotPopup(false);
      }
    } else {
      annotations.push(annotation);
      views.forEach((view) => view?.addAnnotation(annotation));
      setSelection({ ...selection, annotated: true });
    }

    const updatedConfig = updateBooknotes(bookKey, annotations);
    if (updatedConfig) {
      saveConfig(envConfig, bookKey, updatedConfig, settings);
    }
  };

  // Function to handle annotation creation
  const handleAnnotate = () => {
    if (!selection || !selection.text) return;
    const { sectionHref: href } = progress;
    selection.href = href;
    handleHighlight(true);
    setNotebookVisible(true);
    setNotebookNewAnnotation(selection);
    handleDismissPopup();
  };

  // Function to handle text search
  const handleSearch = () => {
    if (!selection || !selection.text) return;
    setShowAnnotPopup(false);
    eventDispatcher.dispatch('search', { term: selection.text });
  };

  // Function to handle dictionary lookup
  const handleDictionary = () => {
    if (!selection || !selection.text) return;
    setShowAnnotPopup(false);
    setShowWiktionaryPopup(true);
  };

  // Function to handle Wikipedia lookup
  const handleWikipedia = () => {
    if (!selection || !selection.text) return;
    setShowAnnotPopup(false);
    setShowWikipediaPopup(true);
  };

  // Function to handle text translation
  const handleTranslation = () => {
    if (!selection || !selection.text) return;
    setShowAnnotPopup(false);
    setShowDeepLPopup(true);
  };

  // Function to handle text-to-speech
  const handleSpeakText = async () => {
    if (!selection || !selection.text) return;
    setShowAnnotPopup(false);
    eventDispatcher.dispatch('tts-speak', { bookKey, range: selection.range });
  };

  const handleExportMarkdown = (event: CustomEvent) => {
     // Extract book key from the event detail
    const { bookKey: exportBookKey } = event.detail;
    if (bookKey !== exportBookKey) return;

    const { bookDoc, book } = bookData;
    if (!bookDoc || !book || !bookDoc.toc) return;

    const config = getConfig(bookKey)!;
    const { booknotes: allNotes = [] } = config;
    const booknotes = allNotes.filter((note) => !note.deletedAt);
    if (booknotes.length === 0) {
      eventDispatcher.dispatch('toast', {
        type: 'info',
        message: _('No annotations to export'),
        className: 'whitespace-nowrap',
        timeout: 2000,
      });
      return;
    }
    const booknoteGroups: { [href: string]: BooknoteGroup } = {};
    for (const booknote of booknotes) {
      const tocItem = findTocItemBS(bookDoc.toc ?? [], booknote.cfi);
      const href = tocItem?.href || '';
      const label = tocItem?.label || '';
      const id = tocItem?.id || 0;
      if (!booknoteGroups[href]) {
        booknoteGroups[href] = { id, href, label, booknotes: [] };
      }
      booknoteGroups[href].booknotes.push(booknote);
    }

    Object.values(booknoteGroups).forEach((group) => {
      group.booknotes.sort((a, b) => {
        return CFI.compare(a.cfi, b.cfi);
      });
    });

    const sortedGroups = Object.values(booknoteGroups).sort((a, b) => {
      return a.id - b.id;
    });

    const lines: string[] = [];
    lines.push(`# ${book.title}`);
    lines.push(`**${_('Author')}**: ${book.author || ''}`);
    lines.push('');
    lines.push(`**${_('Exported from Readest')}**: ${new Date().toISOString().slice(0, 10)}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`## ${_('Highlights & Annotations')}`);
    lines.push('');

    for (const group of sortedGroups) {
      const chapterTitle = group.label || _('Untitled');
      lines.push(`### ${chapterTitle}`);
      for (const note of group.booknotes) {
        lines.push(`> "${note.text}"`);
        if (note.note) {
          lines.push(`**${_('Note')}**:: ${note.note}`);
        }
        lines.push('');
      }
      lines.push('---');
      lines.push('');
    }

    const markdownContent = lines.join('\n');

    navigator.clipboard?.writeText(markdownContent);
    eventDispatcher.dispatch('toast', {
      type: 'info',
      message: _('Copied to clipboard'),
      className: 'whitespace-nowrap',
      timeout: 2000,
    });
    if (appService?.isMobile) return;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Define annotation buttons
  const selectionAnnotated = selection?.annotated;
  const buttons = [
    { tooltipText: _('Copy'), Icon: FiCopy, onClick: handleCopy },
    {
      tooltipText: selectionAnnotated ? _('Delete Highlight') : _('Highlight'),
      Icon: selectionAnnotated ? RiDeleteBinLine : PiHighlighterFill,
      onClick: handleHighlight,
    },
    { tooltipText: _('Annotate'), Icon: BsPencilSquare, onClick: handleAnnotate },
    { tooltipText: _('Search'), Icon: FiSearch, onClick: handleSearch },
    { tooltipText: _('Dictionary'), Icon: TbHexagonLetterD, onClick: handleDictionary },
    { tooltipText: _('Wikipedia'), Icon: FaWikipediaW, onClick: handleWikipedia },
    { tooltipText: _('Translate'), Icon: BsTranslate, onClick: handleTranslation },
    { tooltipText: _('Speak'), Icon: FaHeadphones, onClick: handleSpeakText },
  ];

   // Render popup components based on state
  return (
    <div>
      {showWiktionaryPopup && trianglePosition && dictPopupPosition && (
        <WiktionaryPopup
          word={selection?.text as string}
          lang={bookData.bookDoc?.metadata.language as string}
          position={dictPopupPosition}
          trianglePosition={trianglePosition}
          popupWidth={dictPopupWidth}
          popupHeight={dictPopupHeight}
        />
      )}
      {showWikipediaPopup && trianglePosition && dictPopupPosition && (
        <WikipediaPopup
          text={selection?.text as string}
          lang={bookData.bookDoc?.metadata.language as string}
          position={dictPopupPosition}
          trianglePosition={trianglePosition}
          popupWidth={dictPopupWidth}
          popupHeight={dictPopupHeight}
        />
      )}
      {showDeepLPopup && trianglePosition && translatorPopupPosition && (
        <DeepLPopup
          text={selection?.text as string}
          position={translatorPopupPosition}
          trianglePosition={trianglePosition}
          popupWidth={transPopupWidth}
          popupHeight={transPopupHeight}
        />
      )}
      {showAnnotPopup && trianglePosition && annotPopupPosition && (
        <AnnotationPopup
          dir={viewSettings.rtl ? 'rtl' : 'ltr'}
          isVertical={viewSettings.vertical}
          buttons={buttons}
          position={annotPopupPosition}
          trianglePosition={trianglePosition}
          highlightOptionsVisible={highlightOptionsVisible}
          selectedStyle={selectedStyle}
          selectedColor={selectedColor}
          popupWidth={annotPopupWidth}
          popupHeight={annotPopupHeight}
          onHighlight={handleHighlight}
        />
      )}
    </div>
  );
};

export default Annotator;
