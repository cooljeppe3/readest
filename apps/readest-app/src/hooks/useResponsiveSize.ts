import { useMediaQuery } from 'react-responsive';

/**
 * Hook to calculate a responsive size based on screen size.
 * @param baseSize - The base size for desktop screens.
 * @returns The responsive size, adjusted for different screen sizes.
 */
export const useResponsiveSize = (baseSize: number) => {
  // Check if the current screen width matches the definition of a phone (max width 480px).
  const isPhone = useMediaQuery({ maxWidth: 480 });
  // Check if the current screen width matches the definition of a tablet (min width 481px, max width 1024px).
  const isTablet = useMediaQuery({ minWidth: 481, maxWidth: 1024 });

  // Adjust the base size according to the device type.
  if (isPhone) {
    // Increase the size for phones by 25%.
    return baseSize * 1.25;
  }
  if (isTablet) {
    // Increase the size for tablets by 15%.
    return baseSize * 1.15;
  }
  // If neither phone nor tablet, return the base size (desktop size).
  return baseSize;
};

/**
 * Hook to get the default icon size, responsive to screen size.
 * @returns The default icon size, responsive to different screen sizes.
 */
export const useDefaultIconSize = () => {
  return useResponsiveSize(20);
};
