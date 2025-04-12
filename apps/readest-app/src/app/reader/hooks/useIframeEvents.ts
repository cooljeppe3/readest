import { useEffect } from 'react';
import { FoliateView } from '@/types/view';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { eventDispatcher } from '@/utils/event';
import { isTauriAppPlatform } from '@/services/environment';
import { tauriGetWindowLogicalPosition } from '@/utils/window';

/**
 * Custom hook for handling click events within an iframe.
 * It manages page turns, toggling the visibility of header/footer bars,
 * and handling wheel events for page navigation.
 * @param bookKey - The unique key of the book.
 * @param viewRef - Ref to the FoliateView instance.
 * @param containerRef - Ref to the HTML container element.
export const useClickEvent = (
  bookKey: string,
  viewRef: React.MutableRefObject<FoliateView | null>,
  containerRef: React.RefObject<HTMLDivElement>,
) => {
  const { appService } = useEnv();
  const { getViewSettings } = useReaderStore();
  const { hoveredBookKey, setHoveredBookKey } = useReaderStore();

  /**
   * Handles page turn events based on clicks or messages received from the iframe.
   * @param msg - Can be either a MessageEvent (from the iframe) or a React.MouseEvent (from a direct click).
   *
   * This function determines the action based on the click position (left, center, right) and
   * whether the settings allow click interactions. It also handles wheel events for page turning.
   */
  const handleTurnPage = async (
    msg: MessageEvent | React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (msg instanceof MessageEvent) {
      if (msg.data && msg.data.bookKey === bookKey) {
        const viewSettings = getViewSettings(bookKey)!;
        if (msg.data.type === 'iframe-single-click') {
          // Handle single click events
          const viewElement = containerRef.current;
          if (viewElement) {
            const { screenX } = msg.data;
            const viewRect = viewElement.getBoundingClientRect();
            let windowStartX;
            // Currently for tauri APP the window.screenX is always 0
            if (isTauriAppPlatform()) {
              if (appService?.isMobile) {
                windowStartX = 0;
              } else {
                const windowPosition = await tauriGetWindowLogicalPosition();
                windowStartX = windowPosition.x;
              }
            } else {
              windowStartX = window.screenX;
            }

            // Calculate view start and center
            const viewStartX = windowStartX + viewRect.left;
            const viewCenterX = viewStartX + viewRect.width / 2;
            const consumed = eventDispatcher.dispatchSync('iframe-single-click');
            if (!consumed) {
              const centerStartX = viewStartX + viewRect.width * 0.375;
              const centerEndX = viewStartX + viewRect.width * 0.625;
              if (
                viewSettings.disableClick! ||
                (screenX >= centerStartX && screenX <= centerEndX)
              ) {
                // If click is in the center or click is disabled, toggle visibility of header and footer
                // toggle visibility of the header bar and the footer bar
                setHoveredBookKey(hoveredBookKey ? null : bookKey);
              } else {
                if (hoveredBookKey) {
                  setHoveredBookKey(null);
                }
                if (!viewSettings.disableClick! && screenX >= viewCenterX) {
                  // Go left or right depending on settings and click position
                  if (viewSettings.swapClickArea) {
                    viewRef.current?.goLeft();
                  } else {
                    viewRef.current?.goRight();
                  }
                } else if (!viewSettings.disableClick! && screenX < viewCenterX) {
                  if (viewSettings.swapClickArea) {
                    viewRef.current?.goRight();
                  } else {
                    viewRef.current?.goLeft();
                  }
                }
              }
            }
          }
        } else if (msg.data.type === 'iframe-wheel' && !viewSettings.scrolled) { // Handle wheel event
          // The wheel event is handled by the iframe itself in scrolled mode.
          const { deltaY } = msg.data;
          if (deltaY > 0) {
            // Scroll down, go to next page
            viewRef.current?.next(1);
          } else if (deltaY < 0) {
            // Scroll up, go to previous page
            viewRef.current?.prev(1);
          }
        } else if (msg.data.type === 'iframe-mouseup') {
          if (msg.data.button === 3) {
            viewRef.current?.history.back();
          } else if (msg.data.button === 4) {
            viewRef.current?.history.forward();
          }
        }
      }
    } else {
      const { clientX } = msg;
      const width = window.innerWidth;
      const leftThreshold = width * 0.5;
      const rightThreshold = width * 0.5;
      if (clientX < leftThreshold) {
        viewRef.current?.goLeft();
      } else if (clientX > rightThreshold) {
        viewRef.current?.goRight();
      }
    }
  };

  // Add event listener for messages from the iframe or clicks, and cleanup on unmount
  useEffect(() => {
    window.addEventListener('message', handleTurnPage);
    return () => {
      window.removeEventListener('message', handleTurnPage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredBookKey, viewRef]);

  // Return the handleTurnPage function for use in components
  return {
    handleTurnPage,
  };
};

interface IframeTouch {
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
}

interface IframeTouchEvent {
  targetTouches: IframeTouch[];
}

/**
 * Custom hook for handling touch events within an iframe.
 * It manages swipe gestures for page turning and toggling the visibility of header/footer bars.
 * @param bookKey - The unique key of the book.
 * @param viewRef - Ref to the FoliateView instance.
 *
 */
export const useTouchEvent = (
  bookKey: string,
  viewRef: React.MutableRefObject<FoliateView | null>,
) => {
  const { hoveredBookKey, setHoveredBookKey, getViewSettings } = useReaderStore();
  const viewSettings = getViewSettings(bookKey)!;

  let touchStart: IframeTouch | null = null;
  let touchEnd: IframeTouch | null = null;

  // Record the start touch coordinates
  const onTouchStart = (e: IframeTouchEvent) => {
    touchEnd = null;
    const touch = e.targetTouches[0];
    if (!touch) return;
    touchStart = touch;
  };

  // Record the move touch coordinates
  const onTouchMove = (e: IframeTouchEvent) => {
    if (!touchStart) return;
    const touch = e.targetTouches[0];
    if (touch) {
      touchEnd = touch;
    }
    if (hoveredBookKey && touchEnd) {
      const deltaY = touchEnd.screenY - touchStart.screenY;
      const deltaX = touchEnd.screenX - touchStart.screenX;
      if (!viewSettings!.scrolled && !viewSettings!.vertical) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
          setHoveredBookKey(null);
        }
      } else {
        setHoveredBookKey(null);
      }
    }
  };

  // Handle the touch end and make decisions based on the touch start and end coordinates
  const onTouchEnd = (e: IframeTouchEvent) => {
    if (!touchStart) return;

    const touch = e.targetTouches[0];
    if (touch) {
      touchEnd = touch;
    }

    const windowWidth = window.innerWidth;
    if (touchEnd) {
      const deltaY = touchEnd.screenY - touchStart.screenY;
      const deltaX = touchEnd.screenX - touchStart.screenX;
      // also check for deltaX to prevent swipe page turn from triggering the toggle
      if (
        deltaY < -10 &&
        Math.abs(deltaY) > Math.abs(deltaX) &&
        Math.abs(deltaX) < windowWidth * 0.3
      ) {
        // swipe up to toggle the header bar and the footer bar, only for horizontal page mode
        if (!viewSettings!.scrolled && !viewSettings!.vertical) {
          setHoveredBookKey(hoveredBookKey ? null : bookKey);
        }
      } else {
        if (hoveredBookKey) {
          setHoveredBookKey(null);
        }
      }
    }

    touchStart = null;
    touchEnd = null;
  };

  // Process the message from the iframe to start, move or end touch
  const handleTouch = (msg: MessageEvent) => {
    if (msg.data && msg.data.bookKey === bookKey) {
      if (msg.data.type === 'iframe-touchstart') {
        onTouchStart(msg.data);
      } else if (msg.data.type === 'iframe-touchmove') {
        onTouchMove(msg.data);
      } else if (msg.data.type === 'iframe-touchend') {
        onTouchEnd(msg.data);
      }
    }
  };

  // Add event listener for messages from the iframe and cleanup on unmount
  useEffect(() => {
    window.addEventListener('message', handleTouch);
    return () => {
      window.removeEventListener('message', handleTouch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredBookKey, viewRef]);
};
