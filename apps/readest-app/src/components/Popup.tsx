import { Position } from '@/utils/sel';

/**
 * Popup component: A versatile component for displaying floating content.
 * It includes an optional triangle pointer to visually connect it to a trigger element.
 */
const Popup = ({
  // Width of the popup container in pixels.
  width,
  // Height of the popup container in pixels.
  height,
  // Position object defining where the popup should appear.
  position,
  // Position object for the triangle, including its direction and coordinates.
  trianglePosition,
  // Content to be rendered inside the popup.
  children,
  // Additional CSS classes for the popup container.
  className = '',
  // Additional CSS classes for the triangle element.
  triangleClassName = '',
  // Additional inline styles for the popup container.
  additionalStyle = {},
}: {
  // Width of the popup container.
  width: number;
  // Height of the popup container.
  height: number;
  // Position where the popup should be placed.
  position?: Position;
  // Position and direction of the triangle indicator.
  trianglePosition?: Position;
  // Content inside the popup.
  children: React.ReactNode;
  // Custom CSS class for the popup.
  className?: string;
  // Custom CSS class for the triangle.
  triangleClassName?: string;
  // Custom inline styles for the popup.
  additionalStyle?: React.CSSProperties;
}) => (
  <div>
    {/* Main popup container */}
    <div
      id='popup-container'
      className={`bg-base-300 absolute rounded-lg font-sans shadow-xl ${className}`}
      style={{
        // Set width, height, and position of the popup.
        width: `${width}px`,
        height: `${height}px`,
        // Place off-screen if position is not provided.
        left: `${position ? position.point.x : -999}px`,
        top: `${position ? position.point.y : -999}px`,
        ...additionalStyle,
      }}
    >
      {children}
    </div>
    {/* Triangle pointer for the popup */}
    <div
      className={`triangle text-base-300 absolute ${triangleClassName}`}
      style={{
        // Position the triangle horizontally based on its direction.
        left:
          trianglePosition?.dir === 'left'
            // Align triangle to the left.
            ? `${trianglePosition.point.x}px`
            : trianglePosition?.dir === 'right'
              ? `${trianglePosition.point.x}px`
              : `${trianglePosition ? trianglePosition.point.x : -999}px`,
        top:
          trianglePosition?.dir === 'up'
            ? `${trianglePosition.point.y}px`
            : trianglePosition?.dir === 'down'
              ? `${trianglePosition.point.y}px`
              : `${trianglePosition ? trianglePosition.point.y : -999}px`, // Default: off-screen if no trianglePosition.
        // Style the triangle based on direction.
        borderLeft:
          trianglePosition?.dir === 'right'
            // No left border if it's pointing right.
            ? 'none'
            : trianglePosition?.dir === 'left'
              ? `6px solid`
              : '6px solid transparent',
        borderRight:
          trianglePosition?.dir === 'left'
          // No right border if it's pointing left.
            ? 'none'
            : trianglePosition?.dir === 'right'
              ? `6px solid`
              : '6px solid transparent',
        borderTop:
          trianglePosition?.dir === 'down'
          // No top border if it's pointing down.
            ? 'none'
            : trianglePosition?.dir === 'up'
              ? `6px solid`
              : '6px solid transparent',
        borderBottom:
          trianglePosition?.dir === 'up'
            ? 'none'
          // No bottom border if it's pointing up.
            : trianglePosition?.dir === 'down'
              ? `6px solid`
              : '6px solid transparent',
        transform:
        // Apply a transform to center the triangle properly.
          trianglePosition?.dir === 'left' || trianglePosition?.dir === 'right'
            ? 'translateY(-50%)'
            : 'translateX(-50%)',
      }}
    />
  </div>
);

export default Popup;
