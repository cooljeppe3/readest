import { useCallback, useEffect, useRef, useState } from 'react';

// Interface for the options that can be passed to the useLongPress hook.
interface UseLongPressOptions {
  // Callback function to be executed on a tap event (short click/touch).
  onTap?: () => void;
  // Callback function to be executed on a long press event.
  onLongPress?: () => void;
  // Callback function to be executed on a context menu event (right-click).
  onContextMenu?: () => void;
  // Callback function to be executed when the press is cancelled (e.g., moved too far).
  onCancel?: () => void;
  // The time in milliseconds that must elapse to trigger a long press. Defaults to 500ms.
  threshold?: number;
  // The distance in pixels the pointer can move before the press is considered cancelled. Defaults to 10px.
  moveThreshold?: number;
}

// Interface for the result returned by the useLongPress hook.
interface UseLongPressResult {
  // A boolean indicating whether the user is currently pressing.
  pressing: boolean;
  // An object containing the event handlers to be attached to the target element.
  handlers: {
    // Handler for the pointer down event.
    onPointerDown: (e: React.PointerEvent) => void;
    // Handler for the pointer up event.
    onPointerUp: (e: React.PointerEvent) => void;
    // Handler for the pointer move event.
    onPointerMove: (e: React.PointerEvent) => void;
    // Handler for the pointer cancel event.
    onPointerCancel: (e: React.PointerEvent) => void;
    // Handler for the pointer leave event.
    onPointerLeave: (e: React.PointerEvent) => void;
    // Handler for the context menu event (right-click).
    onContextMenu: (e: React.MouseEvent) => void;
  };
}

// The main hook that provides the long press functionality.
export const useLongPress = ({
  onTap,
  onLongPress,
  onContextMenu,
  onCancel,
  threshold = 500, // Default threshold for long press in milliseconds
  moveThreshold = 10, // Default move threshold in pixels
}: UseLongPressOptions): UseLongPressResult => {
  // State to track if the user is currently pressing.
  const [pressing, setPressing] = useState(false);
  // Ref to hold the timer for long press detection.
  const timerRef = useRef<NodeJS.Timeout>();
  // Ref to hold the starting position of the pointer when the press begins.
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  // Ref to store the ID of the active pointer.
  const pointerId = useRef<number | null>(null);
  // Ref to track if the long press event has been triggered.
  const isLongPressTriggered = useRef(false);

  /**
   * Resets the state and clears any active timers or variables.
   *
   * This function is used to reset the hook's internal state after a tap,
   * a long press, or a cancel event. It clears the timeout, resets the
   * pressing state, and clears the starting position and pointer ID.
   */
  const reset = useCallback(() => {
    setPressing(false);
    isLongPressTriggered.current = false;
    startPosRef.current = null;
    pointerId.current = null;
    clearTimeout(timerRef.current);
  }, []);

  /**
   * Handles the pointer down event, starting the long press detection.
   *
   * @param e - The pointer event.
   *
   * This function sets up a timeout to detect a long press. If the pointer
   * is moved or lifted before the timeout, the long press is cancelled.
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) {
        return;
      }

      pointerId.current = e.pointerId;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      isLongPressTriggered.current = false;
      setPressing(true);

      timerRef.current = setTimeout(() => {
        if (startPosRef.current) {
          isLongPressTriggered.current = true;
          onLongPress?.();
          setPressing(false);
        }
      }, threshold);
    },
    [onLongPress, threshold],
  );

  /**
   * Handles the pointer move event, cancelling the long press if moved too far.
   *
   * @param e - The pointer event.
   *
   * This function calculates the distance the pointer has moved from its starting
   * position. If the distance is greater than the move threshold, it cancels the
   * long press and resets the state.
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerId.current || !startPosRef.current) return;

      const deltaX = Math.abs(e.clientX - startPosRef.current.x);
      const deltaY = Math.abs(e.clientY - startPosRef.current.y);

      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        onCancel?.();
        reset();
      }
    },
    [moveThreshold, onCancel, reset],
  );

  /**
   * Handles the pointer up event, triggering a tap or resetting the state.
   *
   * @param e - The pointer event.
   *
   * This function determines whether a tap or a long press occurred. If it's a tap,
   * it checks if the pointer moved too far. If not, it triggers the onTap callback.
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerId.current) return;

      if (!isLongPressTriggered.current && startPosRef.current) {
        const deltaX = Math.abs(e.clientX - startPosRef.current.x);
        const deltaY = Math.abs(e.clientY - startPosRef.current.y);

        if (deltaX <= moveThreshold && deltaY <= moveThreshold) {
          onTap?.();
        }
      }

      reset();
    },
    [onTap, moveThreshold, reset],
  );

  /**
   * Handles pointer cancellation events, calling onCancel and resetting.
   *
   * @param e - The pointer event.
   *
   * This function is called when the browser or the user cancels the pointer
   * interaction. It calls the onCancel callback and resets the state.
   */
  const handleCancel = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerId.current) return;
      onCancel?.();
      reset();
    },
    [onCancel, reset],
  );

  /**
   * Handles the context menu event (right-click), preventing default behavior.
   *
   * @param e - The mouse event.
   *
   * This function is called when a context menu event occurs. It prevents the
   * default context menu from appearing and optionally calls the onContextMenu
   * callback.
   */
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (onContextMenu) {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu();
      }
    },
    [onContextMenu],
  );

  /**
   * Cleanup effect to clear the timeout when the component unmounts.
   * This prevents memory leaks.
   */

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  // Return the state and handlers to the consuming component.
  return {
    pressing,
    // Object containing the event handlers to attach to the target element.
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerMove: handlePointerMove,
      onPointerCancel: handleCancel,
      onPointerLeave: handleCancel,
      onContextMenu: handleContextMenu,
    },
  };
};
