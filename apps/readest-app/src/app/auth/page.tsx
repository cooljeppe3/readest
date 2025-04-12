'use client';

// Import necessary libraries and hooks.
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Import Supabase authentication UI components and styles.
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
// Import icons from react-icons library.
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa';
import { IoArrowBack } from 'react-icons/io5';

// Import custom hooks and utils.
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';
import { useEnv } from '@/context/EnvContext';
import { useThemeStore } from '@/store/themeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
// Import store for the traffic light.
import { useTrafficLightStore } from '@/store/trafficLightStore';
// Import a function to check the running platform.
import { isTauriAppPlatform } from '@/services/environment';
// Import tauri plugins for deep link and oauth.
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { start, cancel, onUrl, onInvalidUrl } from '@fabianlars/tauri-plugin-oauth';
import { openUrl } from '@tauri-apps/plugin-opener';
// Import a function to manage the auth callback.
import { handleAuthCallback } from '@/helpers/auth';
import { getAppleIdAuth, Scope } from './utils/appleIdAuth';
import { authWithCustomTab, authWithSafari } from './utils/nativeAuth';
import { READEST_WEB_BASE_URL } from '@/services/constants';
import WindowButtons from '@/components/WindowButtons';

type OAuthProvider = 'google' | 'apple' | 'azure' | 'github';

interface SingleInstancePayload {
  args: string[];
  cwd: string;
}

interface ProviderLoginProp {
  provider: OAuthProvider;
  handleSignIn: (provider: OAuthProvider) => void;
  Icon: React.ElementType;
  label: string;
}

// Define constants for the web auth callback and deeplink callback.
const WEB_AUTH_CALLBACK = `${READEST_WEB_BASE_URL}/auth/callback`;
const DEEPLINK_CALLBACK = 'readest://auth-callback';

const ProviderLogin: React.FC<ProviderLoginProp> = ({ provider, handleSignIn, Icon, label }) => {
  return (
    <button
      onClick={() => handleSignIn(provider)}
      className={clsx(
        'mb-2 flex w-64 items-center justify-center rounded border p-2.5',
        'bg-base-100 border-base-300 hover:bg-base-200 shadow-sm transition',
      )}
    >
      <Icon />
      <span className='text-base-content/75 px-2 text-sm'>{label}</span>
    </button>
  );
};

// Main AuthPage component.
export default function AuthPage() {
  // Custom hook to get the translation function.
  const _ = useTranslation();
  // Hook to access the router instance.
  const router = useRouter();
  // Hook to manage the login state.
  const { login } = useAuth();
  // Hook to access environment variables and the app service.
  const { envConfig, appService } = useEnv();
  // Hook to access the theme store.
  const { isDarkMode } = useThemeStore();
  // Hook to manage the traffic light state.
  const { isTrafficLightVisible } = useTrafficLightStore();
  // Hook to manage the settings.
  const { settings, setSettings, saveSettings } = useSettingsStore();
  // State to manage the port for the OAuth server.
  const [port, setPort] = useState<number | null>(null);
  // Ref to check if the OAuth server is running.
  const isOAuthServerRunning = useRef(false);
  // State to check if the component is mounted.
  const [isMounted, setIsMounted] = useState(false);
  // Ref to the header element.
  const headerRef = useRef<HTMLDivElement>(null);
  // Function to get the redirect URL for Tauri.
  const getTauriRedirectTo = (isOAuth: boolean) => {
    if (process.env.NODE_ENV === 'production' || appService?.isMobile) {
      return isOAuth || appService?.isMobile ? DEEPLINK_CALLBACK : WEB_AUTH_CALLBACK;
    }
    return `http://localhost:${port}`; // only for development env on Desktop
  };

  const getWebRedirectTo = () => {
    return process.env.NODE_ENV === 'production'
      ? WEB_AUTH_CALLBACK
      : `${window.location.origin}/auth/callback`;
  };

  // Function to handle sign-in with Apple using Tauri.
  const tauriSignInApple = async () => {
    if (!supabase) {
      throw new Error('No backend connected');
    }
    supabase.auth.signOut();
    const request = {
      scope: ['fullName', 'email'] as Scope[],
    };
    const appleAuthResponse = await getAppleIdAuth(request);
    if (appleAuthResponse.identityToken) {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: appleAuthResponse.identityToken,
      });
      if (error) {
        console.error('Authentication error:', error);
      }
    }
  };

  // Function to handle sign-in with other providers using Tauri.
  const tauriSignIn = async (provider: OAuthProvider) => {
    if (!supabase) {
      throw new Error('No backend connected');
    }
    supabase.auth.signOut();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        skipBrowserRedirect: true,
        redirectTo: getTauriRedirectTo(true),
      },
    });

    if (error) {
      console.error('Authentication error:', error);
      return;
    }
    // Open the OAuth URL in a ASWebAuthenticationSession on iOS to comply with Apple's guidelines. For other platforms, open the OAuth URL in the default browser
    if (appService?.isIOSApp) {
      const res = await authWithSafari({ authUrl: data.url });
      if (res) {
        handleOAuthUrl(res.redirectUrl);
      }
    } else if (appService?.isAndroidApp) {
      const res = await authWithCustomTab({ authUrl: data.url });
      if (res) {
        handleOAuthUrl(res.redirectUrl);
      }
    } else {
      await openUrl(data.url);
    }
  };

  // Function to handle the OAuth callback URL.
  const handleOAuthUrl = async (url: string) => {
    console.log('Handle OAuth URL:', url);
    const hashMatch = url.match(/#(.*)/);
    if (hashMatch) {
      const hash = hashMatch[1];
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      const next = params.get('next') ?? '/';
      if (accessToken) {
        handleAuthCallback({ accessToken, refreshToken, type, next, login, navigate: router.push });
      }
    }
  };

  // Function to start the Tauri OAuth process.
  const startTauriOAuth = async () => {
    try {
      if (process.env.NODE_ENV === 'production' || appService?.isMobile) {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const currentWindow = getCurrentWindow();
        currentWindow.listen('single-instance', ({ event, payload }) => {
          console.log('Received deep link:', event, payload);
          const { args } = payload as SingleInstancePayload;
          if (args?.[1]) {
            handleOAuthUrl(args[1]);
          }
        });
        await onOpenUrl((urls) => {
          urls.forEach((url) => {
            handleOAuthUrl(url);
          });
        });
      } else {
        const port = await start();
        setPort(port);
        console.log(`OAuth server started on port ${port}`);

        await onUrl(handleOAuthUrl);
        await onInvalidUrl((url) => {
          console.log('Received invalid OAuth URL:', url);
        });
      }
    } catch (error) {
      console.error('Error starting OAuth server:', error);
    }
  };

  // Function to stop the Tauri OAuth process.
  const stopTauriOAuth = async () => {
    try {
      if (port) {
        await cancel(port);
        console.log('OAuth server stopped');
      }
    } catch (error) {
      console.error('Error stopping OAuth server:', error);
    }
  };

  // Function to handle going back from the auth page.
  const handleGoBack = () => {
    // Keep login false to avoid infinite loop to redirect to the login page
    settings.keepLogin = false;
    setSettings(settings);
    saveSettings(envConfig, settings);
    router.back();
  };

  // Function to get the localization for the auth form.
  const getAuthLocalization = () => {
    return {
      variables: {
        sign_in: {
          email_label: _('Email address'),
          password_label: _('Your Password'),
          email_input_placeholder: _('Your email address'),
          password_input_placeholder: _('Your password'),
          button_label: _('Sign in'),
          loading_button_label: _('Signing in...'),
          social_provider_text: _('Sign in with {{provider}}'),
          link_text: _('Already have an account? Sign in'),
        },
        sign_up: {
          email_label: _('Email address'),
          password_label: _('Create a Password'),
          email_input_placeholder: _('Your email address'),
          password_input_placeholder: _('Your password'),
          button_label: _('Sign up'),
          loading_button_label: _('Signing up...'),
          social_provider_text: _('Sign in with {{provider}}'),
          link_text: _('Don’t have an account? Sign up'),
          confirmation_text: _('Check your email for the confirmation link'),
        },
        magic_link: {
          email_input_label: _('Email address'),
          email_input_placeholder: _('Your email address'),
          button_label: _('Sign in'),
          loading_button_label: _('Signing in ...'),
          link_text: _('Send a magic link email'),
          confirmation_text: _('Check your email for the magic link'),
        },
        forgotten_password: {
          email_label: _('Email address'),
          password_label: _('Your Password'),
          email_input_placeholder: _('Your email address'),
          button_label: _('Send reset password instructions'),
          loading_button_label: _('Sending reset instructions ...'),
          link_text: _('Forgot your password?'),
          confirmation_text: _('Check your email for the password reset link'),
        },
        verify_otp: {
          email_input_label: _('Email address'),
          email_input_placeholder: _('Your email address'),
          phone_input_label: _('Phone number'),
          phone_input_placeholder: _('Your phone number'),
          token_input_label: _('Token'),
          token_input_placeholder: _('Your OTP token'),
          button_label: _('Verify token'),
          loading_button_label: _('Signing in ...'),
        },
      },
    };
  };

  // Effect hook to start the Tauri OAuth process.
  useEffect(() => {
    if (!isTauriAppPlatform()) return;
    if (isOAuthServerRunning.current) return;
    isOAuthServerRunning.current = true;

    startTauriOAuth();
    return () => {
      isOAuthServerRunning.current = false;
      stopTauriOAuth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect hook to handle auth state change.
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token && session.user) {
        login(session.access_token, session.user);
        const redirectTo = new URLSearchParams(window.location.search).get('redirect');
        router.push(redirectTo ?? '/library');
      }
    });

    return () => {
      subscription?.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Effect hook to set isMounted to true when the component is mounted.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Render null if the component is not mounted.
  if (!isMounted) {
    return null; 
  }

  // For tauri app development, use a custom OAuth server to handle the OAuth callback
  // For tauri app production, use deeplink to handle the OAuth callback
  // For web app, use the built-in OAuth callback page /auth/callback
  return isTauriAppPlatform() ? (
    <div
      className={clsx(
        'fixed inset-0 z-0 flex select-none flex-col items-center overflow-y-auto',
        'bg-base-100 border-base-200 border',
        appService?.hasSafeAreaInset && 'pt-[env(safe-area-inset-top)]',
      )}
    >
      <div
        ref={headerRef}
        className={clsx(
          'fixed z-10 flex w-full items-center justify-between py-2 pe-6 ps-4',
          appService?.hasTrafficLight && 'pt-11',
        )}
      >
        <button onClick={handleGoBack} className={clsx('btn btn-ghost h-8 min-h-8 w-8 p-0')}>
          <IoArrowBack className='text-base-content' />
        </button>

        {appService?.hasWindowBar && (
          <WindowButtons
            headerRef={headerRef}
            showMinimize={!isTrafficLightVisible}
            showMaximize={!isTrafficLightVisible}
            showClose={!isTrafficLightVisible}
            onClose={handleGoBack}
          />
        )}
      </div>
      <div
        className={clsx('z-20 pb-8', appService?.hasTrafficLight ? 'mt-24' : 'mt-12')}
        style={{ maxWidth: '420px' }}
      >
        <ProviderLogin
          provider='google'
          handleSignIn={tauriSignIn}
          Icon={FcGoogle}
          label={_('Sign in with Google')}
        />
        <ProviderLogin
          provider='apple'
          handleSignIn={appService?.isIOSApp ? tauriSignInApple : tauriSignIn}
          Icon={FaApple}
          label={_('Sign in with Apple')}
        />
        <ProviderLogin
          provider='github'
          handleSignIn={tauriSignIn}
          Icon={FaGithub}
          label={_('Sign in with GitHub')}
        />
        <hr className='border-base-300 my-3 mt-6 w-64 border-t' />
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme={isDarkMode ? 'dark' : 'light'}
          magicLink={true}
          providers={[]}
          redirectTo={getTauriRedirectTo(false)}
          localization={getAuthLocalization()}
        />
      </div>
    </div>
  ) : (
    <div style={{ maxWidth: '420px', margin: 'auto', padding: '2rem', paddingTop: '4rem' }}>
      <button
        onClick={handleGoBack}
        className='btn btn-ghost fixed left-6 top-6 h-8 min-h-8 w-8 p-0'
      >
        <IoArrowBack className='text-base-content' />
      </button>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme={isDarkMode ? 'dark' : 'light'}
        magicLink={true}
        providers={['google', 'apple', 'github']}
        redirectTo={getWebRedirectTo()}
        localization={getAuthLocalization()}
      />
    </div>
  );
}
