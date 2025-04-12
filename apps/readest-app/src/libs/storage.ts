// Import necessary utility functions and environment variables.
import { getAPIBaseUrl, isWebAppPlatform } from '@/services/environment';
import { getUserID } from '@/utils/access';
import { fetchWithAuth } from '@/utils/fetch';
// Import platform-specific file transfer functions and types.
import {
  tauriUpload,
  tauriDownload,
  webUpload,
  webDownload,
  // Type for progress handling.
  ProgressHandler,
  // Type for progress information.
  ProgressPayload,
} from '@/utils/transfer';

// Define the API endpoints for file operations.
const API_ENDPOINTS = {
  // Endpoint for uploading files.
  upload: getAPIBaseUrl() + '/storage/upload',
  // Endpoint for downloading files.
  download: getAPIBaseUrl() + '/storage/download',
  // Endpoint for deleting files.
  delete: getAPIBaseUrl() + '/storage/delete',
};

// Function to create a progress handler for tracking multiple file transfers.
export const createProgressHandler = (
  // Total number of files to be transferred.
  totalFiles: number,
  // Reference to a counter for completed files.
  completedFilesRef: { count: number },
  // Optional callback function to handle progress updates.
  onProgress?: ProgressHandler,
) => {
  return (progress: ProgressPayload) => {
    const fileProgress = progress.progress / progress.total;
    const overallProgress = ((completedFilesRef.count + fileProgress) / totalFiles) * 100;

    if (onProgress) {
      onProgress({
        progress: overallProgress,
        total: 100,
        transferSpeed: progress.transferSpeed,
      });
    }
  };
};

// Function to upload a file to cloud storage.
export const uploadFile = async (
  // The file object to upload.
  file: File,
  // Full path of the file on the local system.
  fileFullPath: string,
  // Optional callback function to handle progress updates.
  onProgress?: ProgressHandler,
  // Optional book hash for associating the file with a book.
  bookHash?: string,
) => {
  // Use try-catch to handle potential errors during the upload process.
  try {
    // Send a request to get the temporary upload URL.
    const response = await fetchWithAuth(API_ENDPOINTS.upload, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        bookHash,
      }),
    });

    // Extract the upload URL from the response.
    const { uploadUrl } = await response.json();
    // Check if the current platform is a web app.
    if (isWebAppPlatform()) {
      // Upload using web platform method.
      await webUpload(file, uploadUrl, onProgress);
    } else {
      // Upload using Tauri platform method.
      await tauriUpload(uploadUrl, fileFullPath, 'PUT', onProgress);
    }
  } catch (error) {
    console.error('File upload failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('File upload failed');
  }
};

// Function to download a file from cloud storage.
export const downloadFile = async (
  // Path of the file in the cloud storage.
  filePath: string,
  // Full path where the file should be saved locally.
  fileFullPath: string,
  // Optional callback function to handle progress updates.
  onProgress?: ProgressHandler,
) => {
  try {
    // Get the user ID for file key generation.
    const userId = await getUserID();
    // Throw error if no user ID is found.
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Construct the file key.
    const fileKey = `${userId}/${filePath}`;
    // Send a request to get the temporary download URL.
    const response = await fetchWithAuth(
      `${API_ENDPOINTS.download}?fileKey=${encodeURIComponent(fileKey)}`,
      {
        method: 'GET',
      },
    );
    // Extract the download URL from the response.
    const { downloadUrl } = await response.json();
    
    // Check if the current platform is a web app.
    if (isWebAppPlatform()) {
      // Download using web platform method.
      return await webDownload(downloadUrl, onProgress);
    } else {
      await tauriDownload(downloadUrl, fileFullPath, onProgress);
      return;
    }
  } catch (error) {
    console.error('File download failed:', error);
    throw new Error('File download failed');
  }
};

// Function to delete a file from cloud storage.
export const deleteFile = async (filePath: string) => {
  try {
    // Get the user ID for file key generation.
    const userId = await getUserID();
    // Throw error if no user ID is found.
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Construct the file key.
    const fileKey = `${userId}/${filePath}`;
    // Send a request to delete the file.
    await fetchWithAuth(`${API_ENDPOINTS.delete}?fileKey=${encodeURIComponent(fileKey)}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('File deletion failed:', error);
    throw new Error('File deletion failed');
  }
};

