'use client';

// Import the AuthProvider component to provide authentication context to the application.
import { AuthProvider } from '@/context/AuthContext';
// Import the EnvProvider component to provide environment variables context.
import { EnvProvider } from '@/context/EnvContext';
// Import the CSPostHogProvider component to provide PostHog analytics context.
import { CSPostHogProvider } from '@/context/PHContext';
// Import the SyncProvider component to provide synchronization context for data.
import { SyncProvider } from '@/context/SyncContext';
// Import IconContext to configure default styles for icons from react-icons.
import { IconContext } from 'react-icons';
// Import the custom hook useDefaultIconSize to manage icon sizes responsively.
import { useDefaultIconSize } from '@/hooks/useResponsiveSize';

/**
 * Providers component is a wrapper that provides various contexts to the application.
 * It ensures that all child components have access to authentication, environment,
 * analytics, and synchronization data.
 *
 * @param {object} props - The properties passed to the Providers component.
 * @param {React.ReactNode} props.children - The child components that will receive the context.
 */
const Providers = ({ children }: { children: React.ReactNode }) => {
  // Use the useDefaultIconSize hook to get the default icon size based on screen responsiveness.
  const iconSize = useDefaultIconSize();
  return (
    // Wrap the application with CSPostHogProvider to enable PostHog analytics.
    <CSPostHogProvider>
      {/* Wrap the application with EnvProvider to provide environment variables context. */}
      <EnvProvider>
        {/* Wrap the application with AuthProvider to provide authentication context. */}
        <AuthProvider>
          {/* Wrap the application with IconContext.Provider to set default styling for icons, including size. */}
          <IconContext.Provider value={{ size: `${iconSize}px` }}>
            {/* Wrap the children with SyncProvider to enable synchronization context. */}
            <SyncProvider>{children}</SyncProvider>
          </IconContext.Provider>
        </AuthProvider>
      </EnvProvider>
    </CSPostHogProvider>
  );
}; // End of Providers component.
 // Export the Providers component to be used throughout the application.
export default Providers;
