import type { NextApiRequest, NextApiResponse } from 'next';
import { corsAllMethods, runMiddleware } from '@/utils/cors';
import { createSupabaseAdminClient } from '@/utils/supabase';
import { validateUserAndToken } from '@/utils/access';

// Define the handler function for the DELETE user API endpoint.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for all methods. This allows requests from any origin.
  await runMiddleware(req, res, corsAllMethods);

  // Check if the request method is DELETE. If not, return a 405 error.
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle potential errors during the process.
  try {
    // Extract user information and token from the Authorization header and validate them.
    // This ensures the user is authenticated before deleting the account.
    const { user, token } = await validateUserAndToken(req.headers['authorization']);

    // If user or token is missing, return a 403 error.
    if (!user || !token) {
      return res.status(403).json({ error: 'Not authenticated' });
    }

    // Create a Supabase admin client for privileged operations.
    const supabaseAdmin = createSupabaseAdminClient();

    // Delete the user using the Supabase admin client.
    // The user's ID is used to specify which user to delete.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    // If there is an error during user deletion, return a 500 error.
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // If the user is successfully deleted, return a 200 success message.
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    // Log any errors that occur during the process for debugging.
    console.error(error);

    // Return a generic 500 error if something goes wrong.
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

// The function `handler` is an asynchronous function that processes incoming requests.
// It first enables CORS, then checks if the method is DELETE.
// It validates the user and token, creates a Supabase admin client, deletes the user, and returns appropriate responses.
// Any errors that occur during this process are caught, logged, and a 500 error is returned.
