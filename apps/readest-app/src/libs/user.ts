import { getAPIBaseUrl } from '@/services/environment';
import { getUserID } from '@/utils/access';
import { fetchWithAuth } from '@/utils/fetch';
// Define the API endpoint for deleting a user. This endpoint will be appended to the base URL.
const API_ENDPOINT = getAPIBaseUrl() + '/user/delete';

/**
 * @description This function handles the deletion of a user.
 * It retrieves the current user's ID, verifies authentication, and then sends a DELETE request to the server.
 * @async
 * @throws {Error} Throws an error if the user is not authenticated or if the deletion process fails.
 */
export const deleteUser = async () => {
  try {
    // Attempt to get the current user's ID using the getUserID function.
    const userId = await getUserID();
    // Check if the userId is present. If not, it implies the user is not authenticated.
    if (!userId) {
      // Throw an error indicating that the user is not authenticated.
      throw new Error('Not authenticated');
    }
    // Send a DELETE request to the API endpoint, including necessary authentication headers.
    await fetchWithAuth(API_ENDPOINT, {
      method: 'DELETE',
    });
  } catch (error) {
    // If any error occurs during the deletion process, log it to the console.
    console.error('User deletion failed:', error);
    // Throw a generic error to be caught by the caller.
    throw new Error('User deletion failed');
  }
};
