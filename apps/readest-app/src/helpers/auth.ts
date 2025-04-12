import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

/**
 * @interface UseAuthCallbackOptions
 * @description Interface for the options used in the handleAuthCallback function.
 */
interface UseAuthCallbackOptions {
  /** The access token received from the authentication provider. */
  accessToken?: string | null;
  /** The refresh token received from the authentication provider. */
  refreshToken?: string | null;
  /** A callback function to log in the user with the access token and user object. */
  login: (accessToken: string, user: User) => void;
  /** A callback function to navigate to a different route. */
  navigate: (path: string) => void;
  /** The type of authentication flow (e.g., 'recovery'). */
  type?: string | null;
  /** The path to navigate to after successful authentication. Defaults to '/'. */
  next?: string;
  /** Any error message returned during the authentication process. */
  error?: string | null;
  /** A specific error code, if applicable. */
  errorCode?: string | null;
  /** A detailed description of the error, if applicable. */
  errorDescription?: string | null;
}

/**
 * @function handleAuthCallback
 * @description Handles the authentication callback after a user attempts to log in or sign up.
 * It sets the session in Supabase, fetches user data, and navigates the user to the appropriate page.
 * @param {UseAuthCallbackOptions} options - The options for handling the authentication callback.
 */
export function handleAuthCallback({
  accessToken,
  refreshToken,
  login,
  navigate,
  type,
  next = '/', // Default navigation path after login
  error,
}: UseAuthCallbackOptions) {
  /**
   * @function finalizeSession
   * @description Finalizes the authentication session by setting the session in Supabase,
   * fetching user data, and navigating the user.
   */
  async function finalizeSession() {
    if (error) { // If there is an error, navigate to the error page.
      navigate('/auth/error');
      return;
    }

    if (!accessToken || !refreshToken) { // If tokens are missing, navigate to the library.
      navigate('/library');
      return;
    }

    const { error: err } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (err) { // If there's an error setting the session, log it and navigate to the error page.
      console.error('Error setting session:', err);
      navigate('/auth/error');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      login(accessToken, user); // Call the login callback with the access token and user data.
      if (type === 'recovery') { // If it's a recovery flow, navigate to the recovery page.
        navigate('/auth/recovery');
        return;
      }
      navigate(next); // Navigate to the specified next path.
    } else {
      console.error('Error fetching user data');
      navigate('/auth/error');
    }
  }

  finalizeSession(); // Call the function to finalize the session.
}
