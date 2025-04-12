/**
 * DoubleBorder component props interface.
 * Defines the shape of the data that DoubleBorder component expects.
 */
interface DoubleBorderProps {
  /** The color of the border. */
  borderColor: string;
  /** The horizontal gap percentage used to position the border. */
  horizontalGap: number;
  /** The vertical margin in pixels. */
  verticalMargin: number;
  /** Whether to show the header part of the border. */
  showHeader: boolean;
  /** Whether to show the footer part of the border. */
  showFooter: boolean;
}

// Define a fixed padding value in pixels.
const paddingPx = 10;

/**
 * DoubleBorder component.
 * This component creates a double border effect with optional header and footer.
 * It uses absolute positioning to overlay the borders and adjust their positions.
 */
const DoubleBorder: React.FC<DoubleBorderProps> = ({
  borderColor,
  horizontalGap,
  verticalMargin,
  showHeader,
  showFooter,
}) => { // Return the JSX to render the DoubleBorder component.
  return (
    <>
      {/* Outer frame: creates the thicker, outer border */}
      <div
        className={'borderframe pointer-events-none absolute'}
        style={{
          border: `4px solid ${borderColor}`,
          height: `calc(100% - ${verticalMargin * 2}px + ${paddingPx * 2}px)`,
          top: `calc(${verticalMargin}px - ${paddingPx}px)`,
          // Calculate the left and right positions considering the horizontal gap, footer/header presence, and padding.
          left: `calc(${horizontalGap}% - ${showFooter ? 32 : 0}px - ${paddingPx}px)`,
          right: `calc(${horizontalGap}% - ${showHeader ? 32 : 0}px - ${paddingPx}px)`,
        }}
      ></div>
      {/* inner frame */}
      <div
        className={'borderframe pointer-events-none absolute'}
        style={{
          border: `1px solid ${borderColor}`,
          height: `calc(100% - ${verticalMargin * 2}px)`,
          top: `${verticalMargin}px`,
          // Adjust left and right positions based on header and footer visibility.
          left: showFooter ? `${horizontalGap}%` : `calc(${horizontalGap}%)`,
          right: showHeader ? `${horizontalGap}%` : `calc(${horizontalGap}%)`,
        }}
      />
      {/* footer */}
      {showFooter && (
        <div
          className={'borderframe pointer-events-none absolute'}
          style={{
            borderTop: `1px solid ${borderColor}`,
            // Style the footer with a 1px border on the top, bottom, and left.
            borderBottom: `1px solid ${borderColor}`,
            borderLeft: `1px solid ${borderColor}`,
            width: '32px',
            height: `calc(100% - ${verticalMargin * 2}px)`,
            top: `${verticalMargin}px`,
            left: `calc(${horizontalGap}% - 32px)`,
          }}
        />
      )}
      {/* header */}
      {showHeader && (
        <div
          className={'borderframe pointer-events-none absolute'}
          style={{
            borderTop: `1px solid ${borderColor}`,
            // Style the header with a 1px border on the top, bottom, and right.
            borderBottom: `1px solid ${borderColor}`,
            borderRight: `1px solid ${borderColor}`,
            width: '32px',
            height: `calc(100% - ${verticalMargin * 2}px)`,
            top: `${verticalMargin}px`,
            left: `calc(100% - ${horizontalGap}%)`,
          }}
        />
      )}
    </>
  );
};

// Export DoubleBorder component as the default export.
export default DoubleBorder;
