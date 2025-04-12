'use client';

import { useEffect } from 'react'; // Import the useEffect hook for side effects in functional components.
import { useRouter } from 'next/navigation'; // Import the useRouter hook to programmatically navigate between routes.
import { useTheme } from '@/hooks/useTheme'; // Import the custom useTheme hook to manage theme settings.

// AuthErrorPage component: This component is displayed when there is an error during the authentication process.
export default function AuthErrorPage() {
  const router = useRouter(); // Initialize the router to use for programmatic navigation.
  useTheme(); // Call the useTheme hook to apply theme settings to this page.

  // useEffect hook: This hook runs after every render to set up and clean up side effects.
  useEffect(() => {
    // Set a timer to redirect the user to the login page after 3 seconds.
    const timer = setTimeout(() => {
      router.push('/auth'); // Redirect to the /auth route (login page).
    }, 3000); // Delay of 3000 milliseconds (3 seconds).

    // Cleanup function: This function runs when the component unmounts or before the effect runs again.
    return () => clearTimeout(timer); // Clear the timer to prevent the redirect if the component unmounts before 3 seconds.
  }, [router]); // Dependency array: The effect will re-run if the 'router' object changes.

  // JSX structure: The return value defines the structure and content of the page.
  return (
    // Main container: This div provides the layout and base styles for the page.
    // - bg-base-200/50: sets a semi-transparent background color from the theme's base-200 color.
    // - text-base-content: sets the text color based on the theme's base content color.
    // - hero: applies hero-section specific styles, creating a large section, often used for landing pages.
    // - h-screen: sets the height to fill the full screen height.
    // - items-center: vertically centers items in the flex container.
    // - justify-center: horizontally centers items in the flex container.
    <div className='bg-base-200/50 text-base-content hero h-screen items-center justify-center'>
      {/* Hero content: This div contains the main content of the hero section. */}
      <div className='hero-content text-neutral-content text-center'>
        {/* Container for content: This div limits the width of the content. */}
        <div className='max-w-md'>
          {/* Message: Displays a message to the user. */}
          <p className='mb-5'>You will be redirected to the login page shortly...</p>
          {/* Button: A button that, when clicked, redirects the user to the login page. */}
          // - btn: base button styles.
          // - btn-primary: button with primary style.
          // - rounded-xl: adds extra large border radius.
          <button className='btn btn-primary rounded-xl' onClick={() => router.push('/auth')}>
            Go to Login {/* Button text */}
          </button>
        </div>
      </div>
    </div>
  );
}
