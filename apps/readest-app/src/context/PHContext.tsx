'use client';
import { ReactNode } from 'react';
// Import the posthog library for analytics.
import posthog from 'posthog-js';
// Import the PostHogProvider from posthog-js/react to wrap the application and provide the PostHog client.
import { PostHogProvider } from 'posthog-js/react';

// Check if the code is running in the browser and if the application is in production mode.
if (
  typeof window !== 'undefined' &&
  process.env['NODE_ENV'] === 'production' &&
  process.env['NEXT_PUBLIC_POSTHOG_KEY']
) {
  // Initialize PostHog with the API key and configuration options.
  posthog.init(process.env['NEXT_PUBLIC_POSTHOG_KEY'], {
    // Set the API host for PostHog.
    api_host: process.env['NEXT_PUBLIC_POSTHOG_HOST'],
    // Configure PostHog to create or update user profiles.
    person_profiles: 'always',
  });
}

// Define the CSPostHogProvider component, which is a wrapper for the PostHogProvider.
export const CSPostHogProvider = ({ children }: { children: ReactNode }) => {
  // Render the PostHogProvider component, passing the initialized PostHog client and the children components.
  return (
    <PostHogProvider
      client={posthog} // Pass the initialized PostHog client.
    >
      {children} {/* Render the child components. */}
    </PostHogProvider>
  );
};
// The purpose of this file is to initialize PostHog in a production environment and provide the PostHog client throughout the application via the CSPostHogProvider.
// The PostHog client is initialized only if the code is running in the browser, in production mode, and the necessary environment variables are set.
