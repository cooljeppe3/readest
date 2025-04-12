import { useEffect } from 'react';

// Define the threshold (in pixels) at which the pull-to-refresh action is triggered.
const TRIGGER_THRESHOLD = 120;
// Define the threshold (in pixels) at which the pull indicator starts to show.
const SHOW_INDICATOR_THRESHOLD = 60;

// Define the maximum value used in the approximation function.
const MAX = 128;
// Define a constant `k` used in the approximation function.
const k = 0.4;
// Approximation function to determine the translation based on the pull distance
function appr(x: number) {
  return MAX * (1 - Math.exp((-k * x) / MAX));
}

// Define a custom hook `usePullToRefresh` for implementing the pull-to-refresh functionality.
export const usePullToRefresh = (ref: React.RefObject<HTMLDivElement>, onTrigger: () => void) => {
  useEffect(() => {
    // Get the current HTML element from the ref object.
    const el = ref.current;
    // If the element does not exist, exit early.
    if (!el) return;

    // Add a 'touchstart' event listener to the element to handle the start of a touch gesture.
    el.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Define the function `handleTouchStart` to handle the start of a touch gesture.
    function handleTouchStart(startEvent: TouchEvent) {
      // Get the current HTML element from the ref object.
      const el = ref.current;
      // If the element does not exist, exit early.
      if (!el) return;

      // If the element has been scrolled already, do not activate the pull-to-refresh gesture.
      if (el.scrollTop > 0) return;

      // Get the initial x and y coordinates of the touch.
      const initialX = startEvent.touches[0]!.clientX;
      const initialY = startEvent.touches[0]!.clientY;

      // Add 'touchmove' and 'touchend' event listeners to the element.
      el.addEventListener('touchmove', handleTouchMove, { passive: true });
      el.addEventListener('touchend', handleTouchEnd);

      // Define the function `handleTouchMove` to handle the touch move event.
      function handleTouchMove(moveEvent: TouchEvent) {
        // Get the current HTML element from the ref object.
        const el = ref.current;
        // If the element does not exist, exit early.
        if (!el) return;

        // Get the current x and y coordinates of the touch.
        const currentX = moveEvent.touches[0]!.clientX;
        const currentY = moveEvent.touches[0]!.clientY;
        // Calculate the delta (change) in x and y coordinates.
        const dx = currentX - initialX;
        const dy = currentY - initialY;
        // If the touch is moving upwards or more horizontally than vertically, exit early.
        if (dy < 0 || Math.abs(dx) * 2 > Math.abs(dy)) return;

        // Get the parent element to manipulate the pull indicator.
        const parentEl = el.parentNode as HTMLDivElement;
        if (dy > TRIGGER_THRESHOLD) {
          flipArrow(parentEl);
        } else if (dy > SHOW_INDICATOR_THRESHOLD) {
          addPullIndicator(parentEl);
        } else {
          removePullIndicator(parentEl);
        }   
        // Find the wrapper element that is animated.
        const wrapper = el.querySelector('.transform-wrapper') as HTMLElement;
        // If the wrapper element exists, update its transform style based on the approximation function.
        if (wrapper) {
          wrapper.style.transform = `translate3d(0, ${appr(dy)}px, 0)`;
        }
      }

      // add Pull indicator
      function addPullIndicator(el: HTMLDivElement) {
        const indicator = el.querySelector('.pull-indicator');
        if (indicator) {
          if (indicator.classList.contains('flip')) {
            indicator.classList.remove('flip');
          }
          return;
        }

        const pullIndicator = document.createElement('div');
        pullIndicator.className = 'pull-indicator text-gray-500';
        pullIndicator.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 19c-.3 0-.6-.1-.8-.3l-6-6c-.4-.4-.4-1 0-1.4s1-.4 1.4 0L11 16.2V5c0-.6.4-1 1-1s1 .4 1 1v11.2l4.4-4.4c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-6 6c-.2.2-.5.3-.8.3z"/>
          </svg>
        `;
        el.appendChild(pullIndicator);
      }

      // remove Pull indicator
      function removePullIndicator(el: HTMLDivElement) {
        const pullIndicator = el.querySelector('.pull-indicator');
        if (pullIndicator) {
          pullIndicator.remove();
        }
      }

      // Flip the arrow icon in the indicator if the trigger threshold is exceeded.
      function flipArrow(el: HTMLDivElement) {
        const pullIndicator = el.querySelector('.pull-indicator');
        if (pullIndicator && !pullIndicator.classList.contains('flip')) {
          pullIndicator.classList.add('flip');
        }
      }

      // Define the function `handleTouchEnd` to handle the end of a touch gesture.
      function handleTouchEnd(endEvent: TouchEvent) {
        // Get the current HTML element from the ref object.
        const el = ref.current;
        // If the element does not exist, exit early.
        if (!el) return;

        // Find the wrapper element that is animated.
        const wrapper = el.querySelector('.transform-wrapper') as HTMLElement;
        // If the wrapper element exists, reset its transform style.
        if (wrapper) {
          wrapper.style.transform = 'translateY(0)';
        }
        // Remove the pull indicator from the parent element.
        removePullIndicator(el.parentNode as HTMLDivElement);

        // Add a transition effect to the element for a smooth return to the initial position.
        el.style.transition = 'transform 0.2s';

        // Calculate the total vertical movement during the touch gesture.
        const y = endEvent.changedTouches[0]!.clientY;
        const dy = y - initialY;
        // If the total vertical movement exceeds the trigger threshold, call the `onTrigger` function.
        if (dy > TRIGGER_THRESHOLD) {
          onTrigger();
        }
        // Add a listener for the `transitionend` event to clear up the transition style.
        el.addEventListener('transitionend', onTransitionEnd);

        el.removeEventListener('touchmove', handleTouchMove);
        el.removeEventListener('touchend', handleTouchEnd);
      }

      function onTransitionEnd() {
        // Get the current HTML element from the ref object.
        const el = ref.current;
        // If the element does not exist, exit early.
        if (!el) return;
        // Remove the transition style from the element.
        el.style.transition = '';
        // Remove the `transitionend` listener.
        el.removeEventListener('transitionend', onTransitionEnd);
      }
    }
    // Remove the 'touchstart' event listener when the component is unmounted.
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current]);
};
