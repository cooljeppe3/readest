// Import necessary modules and components
import clsx from 'clsx';
import React from 'react';
import Popup from '@/components/Popup';
import PopupButton from './PopupButton';
import HighlightOptions from './HighlightOptions';
// Import utility and type definitions
import { Position } from '@/utils/sel';
import { HighlightColor, HighlightStyle } from '@/types/book';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';

// Define the props interface for the AnnotationPopup component
interface AnnotationPopupProps {
  // The text direction ('ltr' for left-to-right, 'rtl' for right-to-left)
  dir: 'ltr' | 'rtl';
  // Indicates if the layout is vertical
  isVertical: boolean;
  // An array of buttons to display in the popup, each with tooltip text, an icon, and an onClick handler
  buttons: Array<{ tooltipText: string; Icon: React.ElementType; onClick: () => void }>;
  // The position of the popup relative to the screen
  position: Position;
  // The position of the triangle pointer on the popup
  trianglePosition: Position;
  // Indicates whether the highlight options are currently visible
  highlightOptionsVisible: boolean;
  // The currently selected highlight style
  selectedStyle: HighlightStyle;
  // The currently selected highlight color
  selectedColor: HighlightColor;
  // The width of the popup
  popupWidth: number;
  // The height of the popup
  popupHeight: number;
  // Callback function to handle highlighting
  onHighlight: (update?: boolean) => void;
}

const OPTIONS_HEIGHT_PIX = 28;
const OPTIONS_PADDING_PIX = 16;

const AnnotationPopup: React.FC<AnnotationPopupProps> = ({
  // Destructure the props object
  dir,
  isVertical,
  buttons,
  position,
  trianglePosition,
  highlightOptionsVisible,
  selectedStyle,
  selectedColor,
  popupWidth,
  popupHeight,
  onHighlight,
}) => {
  // Use the useResponsiveSize hook to make dimensions responsive to screen size
  const highlightOptionsHeightPx = useResponsiveSize(OPTIONS_HEIGHT_PIX);
  const highlightOptionsPaddingPx = useResponsiveSize(OPTIONS_PADDING_PIX);
  return (
    // Main container div with dynamic text direction
    <div dir={dir}>
      {/* The Popup component that contains the buttons */}
      <Popup
        // Dynamic width and height based on layout orientation
        width={isVertical ? popupHeight : popupWidth}
        height={isVertical ? popupWidth : popupHeight}
        position={position}
        trianglePosition={trianglePosition}
        // CSS classes for the popup container and triangle pointer
        className='selection-popup bg-gray-600 text-white'
        triangleClassName='text-gray-600'
      >
        {/* Container for the popup buttons */}
        <div
          className={clsx(
            // CSS classes for button layout and alignment
            'selection-buttons flex items-center justify-between p-2',
            isVertical ? 'flex-col' : 'flex-row',
          )}
          style={{
            height: isVertical ? popupWidth : popupHeight,
          }}
        >
          {/* Map the buttons array to create PopupButton components */}
          {buttons.map((button, index) => (
            <PopupButton
              key={index}
              showTooltip={!highlightOptionsVisible}
              tooltipText={button.tooltipText}
              Icon={button.Icon}
              onClick={button.onClick}
            />
          ))}
        </div>
        {/* End of the buttons container */}
      </Popup>
      {/* Conditionally render the HighlightOptions component */}
      {highlightOptionsVisible && (
        <HighlightOptions
          isVertical={isVertical} // Pass the vertical layout state
          style={{
            width: `${isVertical ? popupHeight : popupWidth}px`,
            height: `${isVertical ? popupWidth : popupHeight}px`,
            ...(isVertical
              ? {
                  left: `${
                    position.point.x +
                    (highlightOptionsHeightPx + highlightOptionsPaddingPx) *
                      (trianglePosition.dir === 'left' ? -1 : 1)
                  }px`,
                  top: `${position.point.y}px`,
                }
              : {
                  left: `${position.point.x}px`,
                  top: `${
                    position.point.y +
                    (highlightOptionsHeightPx + highlightOptionsPaddingPx) *
                      (trianglePosition.dir === 'up' ? -1 : 1)
                  }px`,
                }),
          }}
          selectedStyle={selectedStyle}
          selectedColor={selectedColor} // Pass the selected color
          onHandleHighlight={onHighlight}
        />
      )}
      {/* End of the conditional HighlightOptions render */}

    </div>
  );
};

export default AnnotationPopup;
