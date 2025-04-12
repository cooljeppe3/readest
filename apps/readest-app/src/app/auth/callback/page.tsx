'use client';

// Import the necessary modules from the 'next/navigation' library for handling client-side routing.
import { useRouter } from 'next/navigation';
// Import the handleAuthCallback function from the '@/helpers/auth' module, which handles the authentication callback process.
import { handleAuthCallback } from '@/helpers/auth';
// Import the useAuth hook from the '@/context/AuthContext' module, which provides access to the authentication context.
import { useAuth } from '@/context/AuthContext';

// Define the AuthCallback component, which will handle the authentication callback.
export default function AuthCallback() {
  // Get the router instance from the useRouter hook for programmatic navigation.
  const router = useRouter();
  // Get the login function from the useAuth hook, which is used to log in the user.
  const { login } = useAuth();

  // Check if the code is running on the server-side. If so, return null because client-side code is needed.
  if (typeof window === 'undefined') {
    return null;
  }
  // Get the hash from the current window location, or set it to an empty string if it doesn't exist.
  const hash = window.location.hash || '';
  // Create a new URLSearchParams object from the hash (removing the leading '#').
  const params = new URLSearchParams(hash.slice(1));

  // Extract the authentication parameters from the URLSearchParams object.
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type = params.get('type');
  // Get the next URL (where to navigate after successful auth) or default to '/'.
  const next = params.get('next') ?? '/';
  // Extract potential error information.
  const error = params.get('error');
  const errorDescription = params.get('error_description');
  const errorCode = params.get('error_code');

  // Call the handleAuthCallback function to handle the authentication process.
  handleAuthCallback({
    // Pass the extracted parameters and functions to handleAuthCallback.
    accessToken,
    refreshToken,
    type,
    next,
    error,
    errorCode,
    // errorDescription used for errors with specific description
    errorDescription,
    login,
    // Use router.push for client side navigation
    navigate: router.push,
  });

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <span className='loading loading-infinity loading-xl w-20'></span>
    </div>
    // Display a loading spinner while the auth is in process.
  );
}
