import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PiUserCircle, PiUserCircleCheck } from 'react-icons/pi'; // User icons from react-icons
import { MdCheck } from 'react-icons/md'; // Check icon from react-icons

import { setAboutDialogVisible } from '@/components/AboutWindow'; // Function to show the "About Readest" dialog
import { hasUpdater, isTauriAppPlatform, isWebAppPlatform } from '@/services/environment'; // Environment utility functions
import { DOWNLOAD_READEST_URL } from '@/services/constants'; // Constant URL for downloading Readest
import { useAuth } from '@/context/AuthContext'; // Authentication context hook
import { useEnv } from '@/context/EnvContext'; // Environment context hook
import { useSettingsStore } from '@/store/settingsStore'; // Settings store hook
import { useTranslation } from '@/hooks/useTranslation'; // Translation hook
import { getStoragePlanData } from '@/utils/access'; // Utility to get storage plan data
import { navigateToLogin, navigateToProfile } from '@/utils/nav'; // Navigation utilities
import { tauriHandleSetAlwaysOnTop, tauriHandleToggleFullScreen } from '@/utils/window'; // Window management utilities for Tauri
import { QuotaType } from '@/types/user'; // User-related type definitions
import MenuItem from '@/components/MenuItem'; // Reusable menu item component
import Quota from '@/components/Quota'; // Component for displaying user quota information

// Interface for the SettingsMenu component props
interface BookMenuProps {
  // Optional function to set the dropdown's open/closed state
  setIsDropdownOpen?: (isOpen: boolean) => void;
}

// Functional component for the Settings Menu
const SettingsMenu: React.FC<BookMenuProps> = ({ setIsDropdownOpen }) => {
  // Translation hook for internationalization
  const _ = useTranslation();
  // Next.js router for programmatic navigation
  const router = useRouter();
  // Environment configuration and application service from EnvContext
  const { envConfig, appService } = useEnv();
  // Authentication details (token, user) from AuthContext
  const { token, user } = useAuth();
  // Settings from the settings store
  const { settings, setSettings, saveSettings } = useSettingsStore();

  // State variables for various settings and user quota
  // State for user quotas
  const [quotas, setQuotas] = React.useState<QuotaType[]>([]);
  const [isAutoUpload, setIsAutoUpload] = useState(settings.autoUpload);
  const [isAutoCheckUpdates, setIsAutoCheckUpdates] = useState(settings.autoCheckUpdates);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(settings.alwaysOnTop);
  const [isScreenWakeLock, setIsScreenWakeLock] = useState(settings.screenWakeLock);
  const [isAutoImportBooksOnOpen, setIsAutoImportBooksOnOpen] = useState(
    settings.autoImportBooksOnOpen,
  );

  // Function to show the "About Readest" dialog
  const showAboutReadest = () => {
    setAboutDialogVisible(true);
    setIsDropdownOpen?.(false);
  };
  // Function to open the download Readest link
  const downloadReadest = () => {
    window.open(DOWNLOAD_READEST_URL, '_blank');
    setIsDropdownOpen?.(false);
  };

  // Function to navigate to the login page
  const handleUserLogin = () => {
    navigateToLogin(router);
    setIsDropdownOpen?.(false);
  };

  // Function to navigate to the user profile page
  const handleUserProfile = () => {
    navigateToProfile(router); // Navigate to user profile page
    setIsDropdownOpen?.(false);
  };

  const handleReloadPage = () => {
    window.location.reload();
    setIsDropdownOpen?.(false);
  };

  // Function to toggle fullscreen mode
  const handleFullScreen = () => {
    tauriHandleToggleFullScreen();
    setIsDropdownOpen?.(false);
  };

  // Function to toggle the "Always on Top" setting for the window
  const toggleAlwaysOnTop = () => {
    settings.alwaysOnTop = !settings.alwaysOnTop;
    setSettings(settings);
    saveSettings(envConfig, settings);
    setIsAlwaysOnTop(settings.alwaysOnTop);
    tauriHandleSetAlwaysOnTop(settings.alwaysOnTop);
    setIsDropdownOpen?.(false);
  };

  // Function to toggle auto-upload of books to the cloud
  const toggleAutoUploadBooks = () => {
    settings.autoUpload = !settings.autoUpload;
    setSettings(settings);
    saveSettings(envConfig, settings);
    setIsAutoUpload(settings.autoUpload);

    if (settings.autoUpload && !user) {
      navigateToLogin(router);
    }
  };

  // Function to toggle auto-import of books when a file is opened
  const toggleAutoImportBooksOnOpen = () => {
    settings.autoImportBooksOnOpen = !settings.autoImportBooksOnOpen;
    setSettings(settings);
    saveSettings(envConfig, settings);
    setIsAutoImportBooksOnOpen(settings.autoImportBooksOnOpen);
  };

  // Function to toggle auto-checking for updates on application start
  const toggleAutoCheckUpdates = () => {
    settings.autoCheckUpdates = !settings.autoCheckUpdates;
    setSettings(settings);
    saveSettings(envConfig, settings);
    setIsAutoCheckUpdates(settings.autoCheckUpdates);
  };

  // Function to toggle the screen wake lock setting
  const toggleScreenWakeLock = () => {
    settings.screenWakeLock = !settings.screenWakeLock;
    setSettings(settings);
    saveSettings(envConfig, settings);
    setIsScreenWakeLock(settings.screenWakeLock);
  };

  // Effect hook to fetch user quota information when the token or user changes
  useEffect(() => {
    // If there's no user or token, don't proceed
    if (!user || !token) return;
    // Get storage plan data from user token
    const storagPlan = getStoragePlanData(token);
    const storageQuota: QuotaType = {
      name: _('Storage'),
      tooltip: _('{{percentage}}% of Cloud Storage Used.', {
        percentage: Math.round((storagPlan.usage / storagPlan.quota) * 100),
      }),
      used: Math.round(storagPlan.usage / 1024 / 1024),
      total: Math.round(storagPlan.quota / 1024 / 1024),
      unit: 'MB',
    };
    // Update the quota state with new data
    setQuotas([storageQuota]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Check if it's a web app
  const isWebApp = isWebAppPlatform();
  // Get the user's avatar URL from user metadata
  const avatarUrl = user?.user_metadata?.['picture'] || user?.user_metadata?.['avatar_url'];
  // Get the user's full name
  const userFullName = user?.user_metadata?.['full_name'];
  // Get the user's first name for display
  const userDisplayName = userFullName ? userFullName.split(' ')[0] : null;

  // JSX for the settings menu component
  return (
    <div
      tabIndex={0}
      className='settings-menu dropdown-content no-triangle border-base-100 z-20 mt-3 w-72 shadow-2xl'
    >
      {user ? (
        <MenuItem
          // Conditionally display user info or "Logged in"
          label={
            userDisplayName
              ? _('Logged in as {{userDisplayName}}', { userDisplayName })
              : _('Logged in')
          }
          labelClass='!max-w-40'
          icon={
            avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={_('User avatar')}
                // Styling for the avatar image
                className='h-5 w-5 rounded-full'
                referrerPolicy='no-referrer'
                width={20}
                height={20}
              />
            ) : (
              <PiUserCircleCheck />
            )
          } // Display user avatar or check icon
        >
          <ul>
             {/* Display user quota */}
            <Quota quotas={quotas} className='h-10 pl-4 pr-2' />
            {/* Navigate to the user profile page */}
            <MenuItem label={_('Account')} noIcon onClick={handleUserProfile} />
          </ul>
        </MenuItem>
      ) : (
        // Display sign in button if user not logged in
        <MenuItem label={_('Sign In')} icon={<PiUserCircle />} onClick={handleUserLogin}></MenuItem>
      )}
      <MenuItem
        // Toggle auto upload settings
        label={_('Auto Upload Books to Cloud')}
        icon={isAutoUpload ? <MdCheck className='text-base-content' /> : undefined} // Display check icon if enabled
        onClick={toggleAutoUploadBooks}
      />
      {isTauriAppPlatform() && !appService?.isMobile && (
        <MenuItem
          label={_('Auto Import on File Open')}
          icon={isAutoImportBooksOnOpen ? <MdCheck className='text-base-content' /> : undefined}
          onClick={toggleAutoImportBooksOnOpen}
        />
      )}
      {hasUpdater() && (
        <MenuItem
          label={_('Check Updates on Start')}
          icon={isAutoCheckUpdates ? <MdCheck className='text-base-content' /> : undefined}
          onClick={toggleAutoCheckUpdates}
        />
      )}
      <hr className='border-base-200 my-1' />
      {appService?.hasWindow && <MenuItem label={_('Fullscreen')} onClick={handleFullScreen} />}
      {appService?.hasWindow && (
        <MenuItem
          label={_('Always on Top')}
          icon={isAlwaysOnTop ? <MdCheck className='text-base-content' /> : undefined}
          onClick={toggleAlwaysOnTop}
        />
      )}
      <MenuItem
        label={_('Keep Screen Awake')}
        icon={isScreenWakeLock ? <MdCheck className='text-base-content' /> : undefined}
        onClick={toggleScreenWakeLock}
      />
      <MenuItem label={_('Reload Page')} onClick={handleReloadPage} />
      <hr className='border-base-200 my-1' />
      {isWebApp && <MenuItem label={_('Download Readest')} onClick={downloadReadest} />}
      <MenuItem label={_('About Readest')} onClick={showAboutReadest} />
    </div>
  );
};

export default SettingsMenu;
