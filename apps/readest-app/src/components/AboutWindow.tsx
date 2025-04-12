import React from 'react';
import Image from 'next/image';
import packageJson from '../../package.json';
import { useTranslation } from '@/hooks/useTranslation'; // Import the translation hook
import { hasUpdater } from '@/services/environment'; // Import the environment check for updater
import { checkForAppUpdates } from '@/helpers/updater'; // Import the function to check for app updates
import Dialog from './Dialog';

// Function to control the visibility of the About Dialog
export const setAboutDialogVisible = (visible: boolean) => {
  const dialog = document.getElementById('about_window'); // Get the dialog element by its ID
  if (visible) {
    (dialog as HTMLDialogElement)?.showModal(); // Show the dialog as a modal
  } else {
    (dialog as HTMLDialogElement)?.close(); // Close the dialog
  }
};

// AboutWindow component definition
export const AboutWindow = () => {
  const _ = useTranslation(); // Initialize the translation function
  const [isUpdated, setIsUpdated] = React.useState(false); // State to track if the app is up to date

  // Function to check for app updates
  const handleCheckUpdate = async () => {
    const update = await checkForAppUpdates(_, false); // Check for updates, passing translation function and a flag to indicate if it's a manual check
    if (!update) { 
      setIsUpdated(true); // If no update is found, set isUpdated to true
    }
  };

  // JSX for the AboutWindow component
  return (
    <>
      {/* Dialog component for the About Window */}
      {/* 
        - id: 'about_window' - The ID for the dialog element, used for visibility control
        - isOpen: false - The dialog starts closed
        - title: _('About Readest') - The title of the dialog, translated using the translation function
        - onClose: () => setAboutDialogVisible(false) - Callback to close the dialog
        - boxClassName: 'sm:!w-96 sm:h-auto' - Custom Tailwind CSS classes for the dialog box
      */}
      <Dialog
        id='about_window'
        isOpen={false}
        title={_('About Readest')}
        onClose={() => setAboutDialogVisible(false)}
        boxClassName='sm:!w-96 sm:h-auto' 
      >
        <div className='about-content flex h-full flex-col items-center justify-center'>
          <div className='flex flex-col items-center px-8'>
            <div className='mb-4'>
              <Image src='/icon.png' alt='App Logo' className='h-24 w-24' width={64} height={64} />
            </div>
            <h2 className='text-2xl font-bold'>Readest</h2>
            {/* Display the app version */}
            <p className='text-neutral-content text-sm'>
              {_('Version {{version}}', { version: packageJson.version })}
            </p>
            {/* Check for the presence of an updater and display the "Check Update" badge if needed */}
            {hasUpdater() && !isUpdated && (
              <span className='badge badge-primary mt-2 cursor-pointer' onClick={handleCheckUpdate}>
                {_('Check Update')}
              </span>
            )}
            {/* Display the "Already the latest version" message if isUpdated is true */}
            {isUpdated && (
              <p className='text-neutral-content mt-2 text-xs'>{_('Already the latest version')}</p>
            )}
          </div>

          <div className='divider py-12 sm:py-2'></div> {/* Visual divider */}

          {/* Copyright and License information */}
          {/* 
            - The copyright information is displayed with the current year
            - The license is linked to the GNU AGPL v3.0 license
            - A link to the source code repository on GitHub is provided
           */}
          <div className='flex flex-col items-center px-4 text-center'>
            <p className='text-neutral-content text-sm'>
              © {new Date().getFullYear()} Bilingify LLC. All rights reserved.
            </p>
            <p className='text-neutral-content mt-2 text-xs'>
              This software is licensed under the{' '}
              <a
                href='https://www.gnu.org/licenses/agpl-3.0.html'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-500 underline'
              >
                GNU Affero General Public License v3.0
              </a>
              . You are free to use, modify, and distribute this software under the terms of the
              AGPL v3 license. Please see the license for more details.
            </p>
            <p className='text-neutral-content my-2 text-xs'>
              Source code is available at{' '}
              <a
                href='https://github.com/readest/readest'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-500 underline'
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </Dialog>
    </>
  );
};
