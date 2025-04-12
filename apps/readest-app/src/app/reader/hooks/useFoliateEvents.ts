import { useEffect } from 'react';
import { FoliateView } from '@/types/view';

/**
 * @interface FoliateEventHandler
 * @description Defines the structure for handling various events from the Foliate viewer.
 *              Each property is an optional callback function that is triggered when its corresponding event occurs.
 */
type FoliateEventHandler = {
  /** @property onLoad - Callback for when the Foliate view has finished loading. */
  onLoad?: (event: Event) => void;
  /** @property onRelocate - Callback for when the Foliate view's location (page or section) changes. */
  onRelocate?: (event: Event) => void;
  /** @property onLinkClick - Callback for when a link within the Foliate content is clicked. */
  onLinkClick?: (event: Event) => void;
  /** @property onRendererRelocate - Callback for when the Foliate renderer changes its location. */
  onRendererRelocate?: (event: Event) => void;
  /** @property onDrawAnnotation - Callback for when an annotation is drawn on the Foliate view. */
  onDrawAnnotation?: (event: Event) => void;
  /** @property onShowAnnotation - Callback for when an annotation is shown on the Foliate view. */
  onShowAnnotation?: (event: Event) => void;
};

/**
 * @function useFoliateEvents
 * @description A custom React hook for managing event listeners on a FoliateView instance.
 *              It handles adding and removing event listeners for specified events.
 * @param {FoliateView | null} view - The FoliateView instance to attach event listeners to.
 *                                     Can be null if the view is not yet initialized.
 * @param {FoliateEventHandler} [handlers] - An optional object containing callback functions for various Foliate events.
 */
export const useFoliateEvents = (view: FoliateView | null, handlers?: FoliateEventHandler) => {
  // Extract event handler functions from the handlers object.
  const onLoad = handlers?.onLoad;
  const onRelocate = handlers?.onRelocate;
  const onLinkClick = handlers?.onLinkClick;
  const onRendererRelocate = handlers?.onRendererRelocate;
  const onDrawAnnotation = handlers?.onDrawAnnotation;
  const onShowAnnotation = handlers?.onShowAnnotation;
  
  // Use useEffect to manage the lifecycle of event listeners.
  useEffect(() => {
    // If the view is null, there's nothing to attach listeners to, so we exit early.
    if (!view) return;
    // Add event listeners for each handler that is defined.
    if (onLoad) view.addEventListener('load', onLoad);
    if (onRelocate) view.addEventListener('relocate', onRelocate);
    if (onLinkClick) view.addEventListener('link', onLinkClick);
    if (onRendererRelocate) view.renderer.addEventListener('relocate', onRendererRelocate);
    if (onDrawAnnotation) view.addEventListener('draw-annotation', onDrawAnnotation);
    if (onShowAnnotation) view.addEventListener('show-annotation', onShowAnnotation);
    
    // Cleanup function: remove event listeners when the component unmounts or dependencies change.
    return () => {
      // Remove each event listener to prevent memory leaks.
      if (onLoad) view.removeEventListener('load', onLoad);
      if (onRelocate) view.removeEventListener('relocate', onRelocate);
      if (onLinkClick) view.removeEventListener('link', onLinkClick);
      if (onRendererRelocate) view.renderer.removeEventListener('relocate', onRendererRelocate);
      if (onDrawAnnotation) view.removeEventListener('draw-annotation', onDrawAnnotation);
      if (onShowAnnotation) view.removeEventListener('show-annotation', onShowAnnotation);
    };
    // The effect depends on the 'view' instance. eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);
};
