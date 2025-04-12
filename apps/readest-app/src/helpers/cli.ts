import { isWebAppPlatform, hasCli } from '@/services/environment';

// Declare global properties for the window object, which might be used to pass data from the native environment to the web app.
declare global {
  interface Window {
    // An array of file paths that were used to open the application.
    OPEN_WITH_FILES?: string[];
  }
}

// Represents an argument passed via the command-line interface (CLI).
interface CliArgument {
  // The actual value of the argument (e.g., a file path).
  value: string;
  // The number of times this argument occurred.
  occurrences: number;
}

// Parses and returns the list of files passed via the `window.OPEN_WITH_FILES` variable.
const parseWindowOpenWithFiles = () => {
  // Directly return the `window.OPEN_WITH_FILES` array if it's defined.
  return window.OPEN_WITH_FILES;
};

// Parses the command-line arguments passed to the application to find the files that were used to open it.
const parseCLIOpenWithFiles = async () => {
  // Dynamically import the `getMatches` function from the Tauri CLI plugin.
  const { getMatches } = await import('@tauri-apps/plugin-cli');
  // Retrieve the command-line arguments.
  const matches = await getMatches();
  // Extract the arguments from the matches object.
  const args = matches?.args;
  // Initialize an empty array to store the file paths.
  const files: string[] = [];
  // Check if arguments exist.
  if (args) {
    // Loop through predefined argument names to find files.
    for (const name of ['file1', 'file2', 'file3', 'file4']) {
      const arg = args[name] as CliArgument;
      if (arg && arg.occurrences > 0) {
        files.push(arg.value);
      }
    }
  }

  return files;
};

// Parses and returns the files that were used to open the application, either via the window object or CLI.
export const parseOpenWithFiles = async () => {
  // If the application is running as a web app, return an empty array, because there are no files.
  if (isWebAppPlatform()) return [];

  // Try to get the files from the `window.OPEN_WITH_FILES` property first.
  let files = parseWindowOpenWithFiles();
  // If no files were found in the window and the CLI is available, try to get files via the CLI.
  if (!files && hasCli()) {
    // Await for the CLI parsing to finish.
    files = await parseCLIOpenWithFiles();
  }
  // Return the final list of files.
  return files;
};
