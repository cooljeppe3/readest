'use client';

import { useEffect } from 'react'; // Import useEffect hook from React
import { useRouter } from 'next/navigation'; // Import useRouter hook for navigation
import { useAuth } from '@/context/AuthContext'; // Import the authentication context
import { useThemeStore } from '@/store/themeStore'; // Import the theme store
import { useTranslation } from '@/hooks/useTranslation'; // Import the translation hook
import { ThemeSupa } from '@supabase/auth-ui-shared'; // Import the Supabase UI theme
import { Auth } from '@supabase/auth-ui-react'; // Import the Supabase Auth component
import { supabase } from '@/utils/supabase'; // Import the Supabase client

// Define the ResetPasswordPage component
export default function ResetPasswordPage() {
  const _ = useTranslation(); // Initialize the translation hook
  const router = useRouter(); // Initialize the router
  const { login } = useAuth(); // Access the login function from the authentication context
  const { isDarkMode } = useThemeStore(); // Access the isDarkMode state from the theme store

  // Function to define the authentication localization variables
  const getAuthLocalization = () => {
    return {
      variables: {
        // Define variables for the "update password" view in the Supabase Auth component
        update_password: {
          // Define the label for the password input field
          password_label: _('New Password'),
          // Define the placeholder for the password input field
          password_input_placeholder: _('Your new password'),
          // Define the label for the update password button
          button_label: _('Update password'),
          // Define the label for the loading state of the update password button
          loading_button_label: _('Updating password ...'),
          // Define the confirmation text displayed after successful password update
          confirmation_text: _('Your password has been updated'),
        },
      },
    };
  };

  // useEffect hook to handle changes in authentication state
  // This hook will run after every render.
  // It subscribes to Supabase's auth state changes.
  useEffect(() => {
    // Subscribe to Supabase's onAuthStateChange event
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token && session.user && event === 'USER_UPDATED') {
        login(session.access_token, session.user);
        const redirectTo = new URLSearchParams(window.location.search).get('redirect');
        router.push(redirectTo ?? '/library');
      }
    });
    // Cleanup function to unsubscribe from the event when the component unmounts
    return () => {
      subscription?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // The router is set as dependency for this effect
  }, [router]);

  // Render the component
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='w-full max-w-md'>
        {/* Render the Supabase Auth component */}
        <Auth
          // Pass the Supabase client
          supabaseClient={supabase}
          // Set the view to 'update_password'
          view='update_password'
          // Set the appearance theme to Supabase's default theme
          appearance={{ theme: ThemeSupa }}
          // Set the theme to 'dark' or 'light' based on the isDarkMode state
          theme={isDarkMode ? 'dark' : 'light'}
          // Disable magic links
          magicLink={false}
          // Disable external providers
          providers={[]}
          // Set the localization variables
          localization={getAuthLocalization()}
        />
      </div> {/* End of the container div */}
    </div>
  );
}
