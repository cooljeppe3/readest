import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase, createSupabaseClient } from '@/utils/supabase';
import { corsAllMethods, runMiddleware } from '@/utils/cors';
import { getStoragePlanData } from '@/utils/access';
import { getUploadSignedUrl } from '@/utils/object';

/**
 * Extracts the user object and token from the authorization header.
 * @param {string | undefined} authHeader - The authorization header from the request.
 * @returns {Promise<{ user?: any; token?: string; }>} An object containing the user object and token, or an empty object if not authenticated.
 */
const getUserAndToken = async (authHeader: string | undefined) => {
  // If there's no auth header, there's nothing to do, return empty object
  if (!authHeader) return {};

  // Remove 'Bearer ' prefix to get the token
  const token = authHeader.replace('Bearer ', '');
  // Retrieve the user associated with this token
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  // If an error happened or no user, return empty object, no user
  if (error || !user) return {};
  // If all's well, return the user and token
  return { user, token };
};

/**
 * API handler for uploading files.
 * @param {NextApiRequest} req - The incoming API request.
 * @param {NextApiResponse} res - The outgoing API response.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Run CORS middleware to allow requests from all origins with all methods
  await runMiddleware(req, res, corsAllMethods);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract the user and token from the request headers
    const { user, token } = await getUserAndToken(req.headers['authorization']);
    // If no user or token, not authenticated
    if (!user || !token) {
      return res.status(403).json({ error: 'Not authenticated' });
    }

    // Extract file information from request body
    const { fileName, fileSize, bookHash } = req.body;
    // Check for missing file name or size
    if (!fileName || !fileSize) {
      return res.status(400).json({ error: 'Missing file info' });
    }

    // Get storage plan data (usage, quota) for the user
    const { usage, quota } = getStoragePlanData(token);
    // Check if there's enough storage quota
    if (usage + fileSize > quota) {
      return res.status(403).json({ error: 'Insufficient storage quota', usage });
    }

    // Generate file key for the storage (userId/fileName)
    const fileKey = `${user.id}/${fileName}`;
    // Create a Supabase client for the current user
    const supabase = createSupabaseClient(token);
    // Check if the file already exists in the database
    const { data: existingRecord, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', user.id)
      .eq('file_key', fileKey)
      .limit(1) // Limit to 1 result
      .single(); // Only one record expected

    // If a database error occurred (other than 'PGRST116'), return an error
    if (fetchError && fetchError.code !== 'PGRST116') {
      return res.status(500).json({ error: fetchError.message });
    }
    // Set the object size to the file size
    let objSize = fileSize;
    // If the record already exist, get the existing size
    if (existingRecord) {
      objSize = existingRecord.file_size;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('files')
        .insert([
          {
            // Set file data to database
            user_id: user.id,
            book_hash: bookHash,
            file_key: fileKey,
            file_size: fileSize,
          },
        ])
        .select()
        .single(); // Retrieve the inserted record
      // Debug: Log inserted record
      console.log('Inserted record:', inserted);
      // If an insert error occurred, return an error
      if (insertError) return res.status(500).json({ error: insertError.message });
    }

    try {
      // Get a pre-signed URL for uploading the file
      const uploadUrl = await getUploadSignedUrl(
        fileKey,
        objSize, // Use existing record size if available
        1800, // URL expiration time (seconds)
      );

      res.status(200).json({
        uploadUrl,
        fileKey, // return file key
        usage: usage + fileSize,
        quota,
      });
    } catch (error) {
      console.error('Error creating presigned post:', error);
      res.status(500).json({ error: 'Could not create presigned post' });
    }
  } catch (error) {
    // Log any uncaught errors
    console.error(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
