// Import the clsx utility for conditionally joining class names.
import clsx from 'clsx';
// Import React for creating components.
import React from 'react';

// Define the properties interface for the Ribbon component.
interface RibbonProps {
  // 'width' specifies the width of the ribbon. It's a string because it can be a CSS dimension (e.g., "100px", "50%").
  width: string;
}

// Define the Ribbon functional component, which accepts props of type RibbonProps.
const Ribbon: React.FC<RibbonProps> = ({ width }) => {
  return (
    // The main container for the ribbon.
    <div
      // Use clsx to apply multiple CSS classes to the div.
      // 'absolute' makes the div position itself absolutely relative to its nearest positioned parent.
      // 'inset-0' sets top, right, bottom, and left to 0, effectively stretching it to fill the parent.
      // 'z-10' sets a high z-index to ensure it stays on top of other elements.
      // 'flex' enables flexbox layout.
      // 'h-11' sets a fixed height of 11 units.
      // 'justify-center' horizontally centers its content.
      className={clsx('absolute inset-0 z-10 flex h-11 justify-center')}
      // Dynamically set the width of the container using the 'width' prop.
      style={{ width: width }}
    >
      {/* SVG element for the ribbon shape. */}
      <svg
        stroke='currentColor' // Set the stroke color to the current text color.
        fill='currentColor' // Set the fill color to the current text color.
        strokeWidth='0' // Set the stroke width to 0 to avoid a visible stroke.
        version='1' // Specify the SVG version.
        viewBox='0 0 20 45' // Define the coordinate system for the SVG.
        enableBackground='new 0 0 20 45' // Define the background enable area
        xmlns='http://www.w3.org/2000/svg' // Specify the SVG namespace.
      >
        {/* The path for the ribbon shape. */}
        {/* 'fill="#F44336"' sets the fill color to red. */}
        {/* 'd="..."' defines the shape of the ribbon: */}
        {/* - M 20 45: Move to point (20, 45). */}
        {/* - L 10 35: Draw a line to point (10, 35). */}
        {/* - L 0 45: Draw a line to point (0, 45). */}
        {/* - L 0 0: Draw a line to point (0, 0). */}
        {/* - L 20 0: Draw a line to point (20, 0). */}
        <path fill='#F44336' d='M 20 45 L 10 35 L 0 45 L 0 0 L 20 0'></path>
      </svg>
    </div>
  );
};

// Export the Ribbon component as the default export.
export default Ribbon;
