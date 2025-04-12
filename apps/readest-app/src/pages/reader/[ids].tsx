// Import the useRouter hook from Next.js to access the router object.
import { useRouter } from 'next/router';
// Import AuthProvider to provide authentication context.
import { AuthProvider } from '@/context/AuthContext';
// Import EnvProvider to provide environment variables context.
import { EnvProvider } from '@/context/EnvContext';
// Import CSPostHogProvider to provide PostHog analytics context.
import { CSPostHogProvider } from '@/context/PHContext';
// Import SyncProvider to provide data synchronization context.
import { SyncProvider } from '@/context/SyncContext';
// Import the main Reader component for displaying the reader interface.
import Reader from '@/app/reader/components/Reader';

// Define the main Page component.
export default function Page() {
  // Initialize the router.
  const router = useRouter();
  // Extract the 'ids' query parameter from the router and cast it as a string.
  const ids = router.query['ids'] as string;
  // Return the component tree, wrapping the Reader component in multiple context providers.
  return (
    // Wrap the component tree with CSPostHogProvider for PostHog analytics.
    <CSPostHogProvider>
      <EnvProvider>
        <AuthProvider>
          <SyncProvider>
            <Reader ids={ids} />
          </SyncProvider>
        </AuthProvider>
      </EnvProvider>
    </CSPostHogProvider>
  );
}
