/**
 * This module handles various events that occur within the iframe (reader content area),
 * such as keyboard presses, mouse clicks, wheel scrolling, and touch events.
 * It detects single and double clicks, long holds, and sends relevant messages to the parent window.
 */
import {
  DISABLE_DOUBLE_CLICK_ON_MOBILE,
  DOUBLE_CLICK_INTERVAL_THRESHOLD_MS,
  LONG_HOLD_THRESHOLD,
} from '@/services/constants';

import { eventDispatcher } from '@/utils/event';
import { getOSPlatform } from '@/utils/misc';

// Determine if double-click is enabled based on the device type
const doubleClickEnabled =
  !DISABLE_DOUBLE_CLICK_ON_MOBILE || !['android', 'ios'].includes(getOSPlatform());

// Variables to track click times and long hold timeouts
let lastClickTime = 0;
let longHoldTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Handles keydown events within the iframe.
 * @param {string} bookKey - The unique identifier for the book.
 * @param {KeyboardEvent} event - The keyboard event object.
 */
export const handleKeydown = (bookKey: string, event: KeyboardEvent) => {
  // Prevent default behavior for navigation keys
  if (['Backspace', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault();
  }
  // Post a message to the parent window to signal a keydown event
  window.postMessage(
    {
      // Type of event
      type: 'iframe-keydown',
      // Book identifier
      bookKey,
      // Key details
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    },
    '*',
  );
};

/**
 * Handles mousedown events within the iframe.
 * @param {string} bookKey - The unique identifier for the book.
 * @param {MouseEvent} event - The mouse event object.
 */
export const handleMousedown = (bookKey: string, event: MouseEvent) => {
  // Set a timeout to detect long holds
  longHoldTimeout = setTimeout(() => {
    longHoldTimeout = null;
  }, LONG_HOLD_THRESHOLD);

  // Post a message to the parent window to signal a mousedown event
  window.postMessage(
    {
      // Event details
      type: 'iframe-mousedown',
      bookKey,
      button: event.button,
      screenX: event.screenX,
      screenY: event.screenY,
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: event.offsetX,
      offsetY: event.offsetY,
    },
    '*',
  );
};

/**
 * Handles mouseup events within the iframe.
 * @param {string} bookKey - The unique identifier for the book.
 * @param {MouseEvent} event - The mouse event object.
 */
export const handleMouseup = (bookKey: string, event: MouseEvent) => {
  // Prevent default behavior for mouse back and forward buttons
  if ([3, 4].includes(event.button)) {
    event.preventDefault();
  }
  // Post a message to the parent window to signal a mouseup event
  window.postMessage(
    {
      // Event details
      type: 'iframe-mouseup',
      bookKey,
      button: event.button,
      screenX: event.screenX,
      screenY: event.screenY,
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: event.offsetX,
      offsetY: event.offsetY,
    },
    '*',
  );
};

/**
 * Handles wheel events (mouse scroll) within the iframe.
 * @param {string} bookKey - The unique identifier for the book.
 * @param {WheelEvent} event - The wheel event object.
 */
export const handleWheel = (bookKey: string, event: WheelEvent) => {
  // Post a message to the parent window to signal a wheel event
  window.postMessage(
    {
      // Event details
      type: 'iframe-wheel',
      bookKey,
      deltaMode: event.deltaMode,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaZ: event.deltaZ,
      screenX: event.screenX,
      screenY: event.screenY,
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: event.offsetX,
      offsetY: event.offsetY,
    },
    '*',
  );
};

/**
 * Handles click events within the iframe. Detects single and double clicks.
 * @param {string} bookKey - The unique identifier for the book.
 * @param {MouseEvent} event - The mouse event object.
 */
export const handleClick = (bookKey: string, event: MouseEvent) => {
  // Record the current time for double-click detection
  const now = Date.now();

  // Check if a double click has occurred
  if (doubleClickEnabled && now - lastClickTime < DOUBLE_CLICK_INTERVAL_THRESHOLD_MS) {
    lastClickTime = now;
    // Post a message to the parent window to signal a double-click event
    window.postMessage(
      {
        // Event details
        type: 'iframe-double-click',
        screenX: event.screenX,
        screenY: event.screenY,
        clientX: event.clientX,
        clientY: event.clientY,
        offsetX: event.offsetX,
        offsetY: event.offsetY,
      },
      '*',
    );
    return;
  }

  // Update the last click time
  lastClickTime = now;

  /**
   * Function to post a single-click event message to the parent window
   */
  const postSingleClick = () => {
    let element: HTMLElement | null = event.target as HTMLElement;
    while (element) {
      // Ignore single-click if we click on specific element tags
      if (['sup', 'a', 'audio', 'video'].includes(element.tagName.toLowerCase())) {
        return;
      }
      if (element.classList.contains('js_readerFooterNote')) {
        eventDispatcher.dispatch('footnote-popup', {
          bookKey,
          element,
          footnote: element.getAttribute('data-wr-footernote') || '',
        });
        return;
      }
      element = element.parentElement;
    }

    // if long hold is detected, we don't want to send single click event. Ignore it.
    if (!longHoldTimeout) {
      return;
    }

    // Send a message to the parent window to signal a single-click event
    // Event details
    window.postMessage(
      {
        type: 'iframe-single-click',
        bookKey,
        screenX: event.screenX,
        screenY: event.screenY,
        clientX: event.clientX,
        clientY: event.clientY,
        offsetX: event.offsetX,
        offsetY: event.offsetY,
      },
      '*',
    );
  };

  // Check for a single-click event based on time elapsed
  if (doubleClickEnabled) {
    setTimeout(() => {
      if (Date.now() - lastClickTime >= DOUBLE_CLICK_INTERVAL_THRESHOLD_MS) {
        postSingleClick();
      }
    }, DOUBLE_CLICK_INTERVAL_THRESHOLD_MS);
  } else {
    postSingleClick();
  }
};

/**
 * Handles touch events and posts a message to the parent window.
 * @param {string} bookKey - The unique identifier for the book.
 * @param {TouchEvent} event - The touch event object.
 * @param {string} type - The type of touch event (e.g., 'iframe-touchstart').
 */
const handleTouchEv = (bookKey: string, event: TouchEvent, type: string) => {
  const touch = event.targetTouches[0];
  const touches = [];
  if (touch) { // check if the touch object is valid
    touches.push({
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
    });
  }
  window.postMessage(
    // Post a message with touch event details
    {
      type: type,
      bookKey,
      targetTouches: touches,
    },
    '*',
  );
};

/**
 * Handles touch start events within the iframe.
 * @param {string} bookKey - The unique identifier for the book.
 * @param {TouchEvent} event - The touch event object.
 */
export const handleTouchStart = (bookKey: string, event: TouchEvent) => {
  handleTouchEv(bookKey, event, 'iframe-touchstart');
};

/**
 * Handles touch move events within the iframe.
 * @param {string} bookKey - The unique identifier for the book.
 * @param {TouchEvent} event - The touch event object.
 */
export const handleTouchMove = (bookKey: string, event: TouchEvent) => {
  handleTouchEv(bookKey, event, 'iframe-touchmove');
};
/**
 * Handles touch end events within the iframe.
 * @param {string} bookKey - The unique identifier for the book.
 * @param {TouchEvent} event - The touch event object.
 */
export const handleTouchEnd = (bookKey: string, event: TouchEvent) => {
  handleTouchEv(bookKey, event, 'iframe-touchend');
};
