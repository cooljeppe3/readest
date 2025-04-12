import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, createSupabaseClient } from '@/utils/supabase';
import { corsAllMethods, runMiddleware } from '@/utils/cors';
import { getDownloadSignedUrl } from '@/utils/object'; // Import function to generate signed URLs for object downloads

// Helper function to extract user information and authentication token from the request header
const getUserAndToken = async (authHeader: string | undefined) => {
  // Check if the authorization header exists. If not, return an empty object.
  if (!authHeader) return {};

  // Extract the token from the authorization header, removing the "Bearer " prefix.
  const token = authHeader.replace('Bearer ', '');
  // Use Supabase client to get the user based on the provided token.
  // `getUser` method verifies the token and returns the corresponding user if valid.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return {};
  return { user, token };
}; // Return user and token if successful, otherwise return an empty object.

// Main API route handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for all methods. This allows any origin to access the API.
  await runMiddleware(req, res, corsAllMethods);

  // Check if the request method is GET. If not, return a 405 error.
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract user and token from the request header using the helper function.
    const { user, token } = await getUserAndToken(req.headers['authorization']);
    // If no user or token is found, return a 403 error (unauthenticated).
    if (!user || !token) {
      return res.status(403).json({ error: 'Not authenticated' });
    }

    // Extract the `fileKey` from the query parameters.
    const { fileKey } = req.query;

    // Validate that `fileKey` exists and is a string. If not, return a 400 error.
    if (!fileKey || typeof fileKey !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid fileKey' });
    }

    // Create a Supabase client using the provided user token.
    const supabase = createSupabaseClient(token);
    // Query the `files` table to check if the file belongs to the authenticated user.
    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .select('user_id') // Select only the user_id column.
      .eq('user_id', user.id) // Filter by the user's ID.
      .eq('file_key', fileKey) // Filter by the file key.
      .is('deleted_at', null) // Ensure the file is not marked as deleted.
      .limit(1) // Limit the result to one record.
      .single(); // Expect only one record.

    // If there's an error or no file record found, return a 404 error.
    if (fileError || !fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if the file's user ID matches the authenticated user's ID.
    // `fileRecord.user_id` represents the ID of the user who owns the file.
    // `user.id` represents the ID of the user extracted from the authentication token.
    // If these IDs do not match, it means that the file does not belong to the
    // authenticated user, and access should be denied.
    // This comparison ensures that a user can only download files that they have
    // created and are associated with their user ID in the database.

    if (fileRecord.user_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized access to the file' });
    }

    try {
      const downloadUrl = await getDownloadSignedUrl(fileKey, 1800);

      // If successful, return the signed download URL in the response.
      res.status(200).json({
        downloadUrl,
      });
    } catch (error) {
      // If there's an error creating the signed URL, log the error and return a 500 error.
      console.error('Error creating signed URL for download:', error);
      res.status(500).json({ error: 'Could not create signed URL for download' });
    }
  } catch (error) {
    // If any other error occurs, log the error and return a 500 error.
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
