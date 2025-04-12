import type { NextApiRequest, NextApiResponse } from 'next';
import { corsAllMethods, runMiddleware } from '@/utils/cors';
import { createSupabaseClient } from '@/utils/supabase';
import { validateUserAndToken } from '@/utils/access';
import { deleteObject } from '@/utils/object';

/**
 * API handler for deleting a file from storage.
 * @param req - The incoming HTTP request.
 * @param res - The outgoing HTTP response.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Run CORS middleware to allow cross-origin requests.
  await runMiddleware(req, res, corsAllMethods);

  // Check if the request method is DELETE, return 405 if not.
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Try to process the file deletion.
  try {
    // Validate the user and their authentication token from the request headers.
    const { user, token } = await validateUserAndToken(req.headers['authorization']);
    // If the user or token is missing, return 403 Forbidden.
    if (!user || !token) {
      return res.status(403).json({ error: 'Not authenticated' });
    }

    // Extract the fileKey from the request query parameters.
    const { fileKey } = req.query;

    // Check if fileKey is missing or not a string, return 400 Bad Request if so.
    if (!fileKey || typeof fileKey !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid fileKey' });
    }

    // Create a Supabase client instance using the user's token.
    const supabase = createSupabaseClient(token);
    // Query the 'files' table to find the file record associated with the fileKey and user ID.
    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .select('user_id, id')
      .eq('user_id', user.id)
      .eq('file_key', fileKey)
      // Limit to 1 result and expect a single record.
      .limit(1)
      .single();

    // If there's an error or no file record found, return 404 Not Found.
    if (fileError || !fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if the found file record belongs to the authenticated user.
    if (fileRecord.user_id !== user.id) {
      // If not, return 403 Unauthorized.
      return res.status(403).json({ error: 'Unauthorized access to the file' });
    }

    // Attempt to delete the file from storage (S3 or similar).
    try {
      // Delete the file using the fileKey.
      await deleteObject(fileKey);
      // Delete the file record from the 'files' table in Supabase.
      const { error: deleteError } = await supabase.from('files').delete().eq('id', fileRecord.id);

      // If there's an error deleting the file record, log the error and return 500 Internal Server Error.
      if (deleteError) {
        console.error('Error updating file record:', deleteError);
        return res.status(500).json({ error: 'Could not update file record' });
      }

      // If the deletion was successful, return 200 OK with a success message.
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
      // If there's an error deleting the file from storage, log the error and return 500.
      console.error('Error deleting file from S3:', error);
      res.status(500).json({ error: 'Could not delete file from storage' });
    }
  } catch (error) {
    // If there's a general error, log it and return 500.
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
