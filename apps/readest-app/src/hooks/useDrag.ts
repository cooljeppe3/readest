import { useCallback, useRef } from 'react';

/**
 * `useDrag` is a custom hook that enables drag functionality on a component.
 * It tracks the start, move, and end of a drag interaction, providing detailed data about the drag event.
 *
 * @param onDragMove - Callback function triggered when the drag moves.
 * @param onDragEnd - Optional callback function triggered when the drag ends.
 *
 * @returns An object containing a `handleDragStart` function to attach to the element that should be draggable.
 */
export const useDrag = (
  // Callback function that receives drag movement data.
  onDragMove: (data: { clientX: number; clientY: number; deltaX: number; deltaY: number }) => void,
  // Optional callback function that receives drag end data.
  onDragEnd?: (data: {
    velocity: number;
    deltaT: number;
    clientX: number;
    clientY: number;
    deltaX: number; // Total distance moved horizontally.
    deltaY: number; // Total distance moved vertically.
  }) => void,
) => {
  // useRef to track whether a drag is currently in progress.
  const isDragging = useRef(false);
  // useRef to store the initial X coordinate of the drag start.
  const startX = useRef(0);
  // useRef to store the initial Y coordinate of the drag start.
  const startY = useRef(0);
  // useRef to store the last known X coordinate during the drag.
  const lastX = useRef(0);
  // useRef to store the last known Y coordinate during the drag.
  const lastY = useRef(0);
  // useRef to store the start time of the drag.
  const startTime = useRef(0);

  /**
   * `handleDragStart` is a callback function that initializes the drag event.
   * It sets the initial drag properties and attaches listeners for drag movement and end.
   *
   * @param e - Mouse or Touch event.
   */
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Prevent default behavior to avoid conflicts with native dragging.
      e.preventDefault();
      // Set isDragging flag to true to indicate a drag has started.
      isDragging.current = true;

      // Determine whether the event is a touch or mouse event.
      // Set the initial start position accordingly.
      if ('touches' in e) {
        startY.current = e.touches[0]!.clientY;
        startX.current = e.touches[0]!.clientX;
      } else {
        startY.current = e.clientY;
        startX.current = e.clientX;
      };
       // Record the start time for calculating velocity later.
      startTime.current = performance.now();

      /**
       * `handleMove` is a callback function that is called continuously during the drag.
       * It calculates the delta movement and calls the onDragMove callback.
       *
       * @param event - Mouse or Touch event.
       */
      const handleMove = (event: MouseEvent | TouchEvent) => {
        // Proceed only if a drag is in progress.
        if (isDragging.current) {
          // Initialize delta and client coordinates for each drag movement.
          let deltaX = 0;
          let deltaY = 0;
          let clientX = 0;
          let clientY = 0;
          // Check if it is touch event and get current touch position.
          if ('touches' in event && event.touches.length > 0) {
            const currentTouch = event.touches[0]!;
            clientX = currentTouch.clientX;
            clientY = currentTouch.clientY;
            // If it is a mouse event, get the client position.
          } else {
            const evt = event as MouseEvent;
            clientX = evt.clientX;
            clientY = evt.clientY;
          }

          // Calculate the difference in position from the last known location.
          // Update the last position.
          // lastX and lastY is used for calculating delta.
          // if the user is not moving, delta will be zero
          deltaX = clientX - lastX.current;
          deltaY = clientY - lastY.current;
          lastX.current = clientX;
          lastY.current = clientY;

          // Notify the listener of the drag's current state.
          onDragMove({ clientX, clientY, deltaX, deltaY });
        }
      };

      /**
       * `handleEnd` is a callback function that is called when the drag ends.
       * It calculates the total delta movement, the velocity, and calls the onDragEnd callback if provided.
       *
       * @param event - Mouse or Touch event.
       */
      const handleEnd = (event: MouseEvent | TouchEvent) => {
        // Reset isDragging to false.
        isDragging.current = false;
        // Initialize delta and client coordinates for each drag movement.
        let deltaX = 0;
        let deltaY = 0;
        let clientX = 0;
        let clientY = 0;

        // Record the end time for calculating velocity.
        const endTime = performance.now();
        // Calculate the total time elapsed during the drag.
        const deltaT = endTime - startTime.current;

        // Check if it is touch event and get current touch position.
        if ('touches' in event) {
          const currentTouch = event.changedTouches[0]!;
          clientX = currentTouch.clientX;
          clientY = currentTouch.clientY;
          // If it is a mouse event, get the client position.
        } else {
          const evt = event as MouseEvent;
          clientX = evt.clientX;
          clientY = evt.clientY;
        }

        // Calculate the total distance moved since the start of the drag.
        deltaX = clientX - startX.current;
        deltaY = clientY - startY.current;

        // Calculate the velocity of the drag.
        const velocity = deltaY / deltaT;

        // Notify the listener of the drag's end state.
        if (onDragEnd) {
          onDragEnd({ velocity, deltaT, clientX, clientY, deltaX, deltaY });
        }

        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };

      // Add the listeners for move and end.
      // Passive listener to avoid blocking scrolling.
      window.addEventListener('mousemove', handleMove, { passive: true });
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: true });
      window.addEventListener('touchend', handleEnd);
    },
    [onDragMove, onDragEnd],
  ); // Depend on `onDragMove` and `onDragEnd`.

  // Return the start function for drag to enable drag interaction.
  return { handleDragStart };
};
