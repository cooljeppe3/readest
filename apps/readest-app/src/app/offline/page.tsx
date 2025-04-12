// Import the Image component from Next.js for optimized image handling.
import Image from 'next/image';

/**
 * Offline component: Displays a message indicating the user is offline and cannot access online features.
 *
 * This component is a simple representation of a page that is shown when the application detects that the user
 * does not have an active internet connection. It displays an app icon, a title, and an informative message.
 */
export default function Offline() {
  return (
    // Main container for the offline page content.
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-100 text-center'>
      {/* Container for the app icon. */}
      <div className='mb-4'>
        {/* Display the app icon using Next.js Image component for optimized loading. */}
        <Image src='/icon.png' alt='App Icon' width={100} height={100} className='rounded-lg' />
      </div>
      {/* Title of the app. */}
      <h1 className='text-2xl font-bold text-gray-800'>Readest</h1>
      {/* Informative message to the user about the offline status. */}
      <p className='mt-2 text-gray-600'>
        It seems you&apos;re offline. Please check your internet connection and try again.
      </p>
    </div>
  ); }
