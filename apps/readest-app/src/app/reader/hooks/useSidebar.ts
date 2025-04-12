// Import necessary modules and stores from the project.
import { useSettingsStore } from '@/store/settingsStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useEffect } from 'react';

// Define the custom hook 'useSidebar', which manages the state and behavior of the sidebar in the reader view.
const useSidebar = (initialWidth: string, isPinned: boolean) => {
  // Access the settings store to manage application settings, including sidebar settings.
  const { settings } = useSettingsStore();

  // Access the sidebar store to manage sidebar-specific states and actions.
  const {
    // Retrieve the current width of the sidebar.
    sideBarWidth,
    // Check if the sidebar is currently visible.
    isSideBarVisible,
    // Check if the sidebar is currently pinned.
    isSideBarPinned,
    // Function to set the width of the sidebar.
    setSideBarWidth,
    // Function to set the visibility of the sidebar.
    setSideBarVisible,
    // Function to set the pinned state of the sidebar.
    setSideBarPin,
    // Function to toggle the visibility of the sidebar.
    toggleSideBar,
    // Function to toggle the pinned state of the sidebar.
    toggleSideBarPin,
  } = useSidebarStore();

  // useEffect hook to initialize the sidebar's state when the component mounts.
  useEffect(() => {
    // Set the initial width of the sidebar based on the 'initialWidth' prop.
    setSideBarWidth(initialWidth);
    // Set the pinned state of the sidebar based on the 'isPinned' prop.
    setSideBarPin(isPinned);
    // Set the initial visibility of the sidebar to 'isPinned' (visible if pinned, otherwise hidden).
    setSideBarVisible(isPinned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // The empty dependency array ensures this effect runs only once on mount.
  }, []);

  // Function to handle the resizing of the sidebar.
  const handleSideBarResize = (newWidth: string) => {
    // Update the sidebar width in the store.
    setSideBarWidth(newWidth);
    // Update the sidebar width in the global settings.
    settings.globalReadSettings.sideBarWidth = newWidth;
  };

  // Function to handle the toggling of the sidebar's pinned state.
  const handleSideBarTogglePin = () => {
    // Toggle the pinned state of the sidebar in the store.
    toggleSideBarPin();
    // Update the pinned state in the global settings.
    settings.globalReadSettings.isSideBarPinned = !isSideBarPinned;
    // If the sidebar is pinned and visible, unpinning it should hide it.
    if (isSideBarPinned && isSideBarVisible) setSideBarVisible(false);
  };

  // Return the sidebar's state and control functions.
  return {
    // Current width of the sidebar.
    sideBarWidth,
    // Whether the sidebar is pinned or not.
    isSideBarPinned,
    // Whether the sidebar is visible or not.
    isSideBarVisible,
    handleSideBarResize,
    handleSideBarTogglePin,
    setSideBarVisible,
    toggleSideBar,
  };
};
// Export the custom hook for use in other components.
// This hook provides a way to manage the sidebar's state and behavior in the application.
export default useSidebar;
