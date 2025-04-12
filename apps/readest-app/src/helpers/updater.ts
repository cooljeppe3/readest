// Import necessary modules from Tauri's plugin system.
import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';
// Import application-specific constants and types.
import { CHECK_UPDATE_INTERVAL_SEC } from '@/services/constants';
import { TranslationFunc } from '@/hooks/useTranslation';

// Define a constant for the local storage key used to store the last update check timestamp.
const LAST_CHECK_KEY = 'lastAppUpdateCheck';

// Function to check for application updates.
export const checkForAppUpdates = async (_: TranslationFunc, autoCheck = true) => {
  // Retrieve the timestamp of the last update check from local storage.
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  // Get the current timestamp.
  const now = Date.now();
  // If auto-checking is enabled, check if the update interval has elapsed since the last check.
  // If the interval hasn't elapsed, return early without checking for updates.
  if (autoCheck && lastCheck && now - parseInt(lastCheck, 10) < CHECK_UPDATE_INTERVAL_SEC * 1000)
    return;
  // Store the current timestamp in local storage to record the time of this check.
  localStorage.setItem(LAST_CHECK_KEY, now.toString());

  // Log a message to the console indicating that the app is checking for updates.
  console.log('Checking for updates');
  // Use the Tauri updater plugin to check for updates.
  const update = await check();
  // Log the update information to the console.
  console.log('Update found', update);
  // If an update is available.
  if (update) {
    // Prompt the user with a dialog to ask if they want to update to the new version.
    const yes = await ask(
      `
      Update to ${update.version} is available!
      Release notes: ${update.body}
      `,
      {
        // Use translation function for translatable strings
        title: _('Update Now!'),
        kind: 'info',
        okLabel: _('Update'),
        cancelLabel: _('Cancel'),
      },
    );
    // if user select to update
    if (yes) {
      console.log(`found update ${update.version} from ${update.date} with notes ${update.body}`);
      let downloaded = 0;
      let contentLength = 0;
      let lastLogged = 0;
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          // when download starts
          case 'Started':
            // get the file total length
            contentLength = event.data.contentLength!;
            console.log(`started downloading ${event.data.contentLength} bytes`);
            break;
          // during download progress
          case 'Progress':
            // add the download chunk
            downloaded += event.data.chunkLength;
            // log the download progress if the downloded data is greated than 1Mb
            if (downloaded - lastLogged >= 1 * 1024 * 1024) {
              console.log(`downloaded ${downloaded} bytes from ${contentLength}`);
              lastLogged = downloaded;
            }
            break;
          // when the download finishes
          case 'Finished':
            console.log('download finished');
            break;
        }
      });

      // log that the update is installed and relaunch
      console.log('update installed');
      await relaunch();
    }
  }
  return update;
};
