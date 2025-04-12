import type { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase, createSupabaseClient } from '@/utils/supabase';
import { BookDataRecord } from '@/types/book';
import { transformBookConfigToDB } from '@/utils/transform';
import { transformBookNoteToDB } from '@/utils/transform';
import { transformBookToDB } from '@/utils/transform';
import { runMiddleware, corsAllMethods } from '@/utils/cors';
import { SyncData, SyncResult, SyncType } from '@/libs/sync';
// Define a mapping of data types to their respective transformation functions for database storage.
const transformsToDB = {
  // Transform function for book data.
  books: transformBookToDB,
  // Transform function for book note data.
  book_notes: transformBookNoteToDB,
  // Transform function for book configuration data.
  book_configs: transformBookConfigToDB,
};
// Define a mapping from database table names to their sync type identifiers.
const DBSyncTypeMap = {
  // Books table sync type identifier.
  books: 'books',
  // Book notes table sync type identifier.
  book_notes: 'notes',
  // Book configurations table sync type identifier.
  book_configs: 'configs',
};

// Type alias for table names based on the transformsToDB object keys.
type TableName = keyof typeof transformsToDB;

// Type alias for a database error, including the table name and the error details.
type DBError = { table: TableName; error: PostgrestError };

// Function to extract the user and authentication token from the request headers.
const getUserAndToken = async (req: NextRequest) => {
  // Retrieve the authorization header.
  const authHeader = req.headers.get('authorization');
  // If no authorization header is present, return an empty object.
  if (!authHeader) return {};
  // Extract the token by removing 'Bearer '.
  const token = authHeader.replace('Bearer ', '');
  try {
    // Attempt to get the user information from Supabase using the token.
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    // Handle specific error messages from Supabase.
    if (error?.message === 'fetch failed') {
      return { error: 'Network error' };
    } else if (error || !user) {
      return { error: 'Not authenticated' };
    }
    // Return the user and token if authentication is successful.
    return { user, token };
  } catch {
    // Catch any network-related errors.
    return { error: 'Network error' };
  }
};

export async function GET(req: NextRequest) {
  const { user, token, error } = await getUserAndToken(req);
  if (!user || !token || error) {
    // Return an error response if the user is not authenticated or there's an error.
    return NextResponse.json({ error: error || 'Unknown error' }, { status: 401 });
  }
  // Create a Supabase client using the user's token.
  const supabase = createSupabaseClient(token);
  // Parse query parameters from the request URL.
  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get('since');
  const typeParam = searchParams.get('type') as SyncType | undefined;
  const bookParam = searchParams.get('book');
  // Ensure the 'since' parameter is provided.
  if (!sinceParam) {
    return NextResponse.json({ error: '"since" query parameter is required' }, { status: 400 });
  }
  // Parse the 'since' parameter into a Date object.
  const since = new Date(Number(sinceParam));
  // Check for invalid timestamp.
  if (isNaN(since.getTime())) {
    return NextResponse.json({ error: 'Invalid "since" timestamp' }, { status: 400 });
  }
  // Convert the 'since' date to an ISO string for database queries.
  const sinceIso = since.toISOString();

  try {
    // Initialize results and errors objects.
    const results: SyncResult = { books: [], configs: [], notes: [] };
    const errors: Record<TableName, DBError | null> = {
      books: null,
      book_notes: null,
      book_configs: null,
    };
    // Helper function to query a table with the given parameters.
    const queryTables = async (table: TableName) => {
      // Build the base query to select all records for the current user.
      let query = supabase.from(table).select('*').eq('user_id', user.id);
      // If bookParam is present, filter by book_hash.
      if (bookParam) {
        query.eq('book_hash', bookParam);
      }
      // Add a filter to select records updated or deleted after the 'since' time.
      query = query.or(`updated_at.gt.${sinceIso},deleted_at.gt.${sinceIso}`);
      // Log the query details for debugging.
      console.log('Querying table:', table, 'since:', sinceIso);
      // Execute the query.
      const { data, error } = await query;
      // If there is an error, throw an object with the table and error details.
      if (error) throw { table, error } as DBError;
      // Otherwise, assign the result to the appropriate key in the results object.
      // The key is determined by the DBSyncTypeMap mapping.
      results[DBSyncTypeMap[table] as SyncType] = data || [];
    };
    // Conditionally query each table based on the typeParam or if no typeParam is provided.
    if (!typeParam || typeParam === 'books') {
      await queryTables('books').catch((err) => (errors['books'] = err));
    }
    if (!typeParam || typeParam === 'configs') {
      await queryTables('book_configs').catch((err) => (errors['book_configs'] = err));
    }
    if (!typeParam || typeParam === 'notes') {
      await queryTables('book_notes').catch((err) => (errors['book_notes'] = err));
    }
    // Check for errors from any of the table queries.
    const dbErrors = Object.values(errors).filter((err) => err !== null);
    if (dbErrors.length > 0) {
      console.error('Errors occurred:', dbErrors);
      // If there are errors, create an error message and send it in the response.
      const errorMsg = dbErrors
        .map((err) => `${err.table}: ${err.error.message || 'Unknown error'}`)
        .join('; ');
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
    // Construct the successful response.
    const response = NextResponse.json(results, { status: 200 });
    // Set caching-related headers to prevent caching.
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Pragma', 'no-cache');
    // Remove ETag header to prevent caching.
    response.headers.delete('ETag');
    // Return the response.
    return response;
  } catch (error: unknown) {
    console.error(error);
    const errorMessage = (error as PostgrestError).message || 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, token, error } = await getUserAndToken(req);
    // Return an error response if the user is not authenticated or there's an error.
  if (!user || !token || error) {
    return NextResponse.json({ error: error || 'Unknown error' }, { status: 401 });
  }
  // Create a Supabase client using the user's token.
  const supabase = createSupabaseClient(token);
    // Parse the request body as JSON.
  const body = await req.json();
  // Destructure the request body into books, configs, and notes arrays.
  const { books = [], configs = [], notes = [] } = body as SyncData;

  // Helper function to upsert records into a table.
  const upsertRecords = async (
    table: TableName,
    primaryKeys: (keyof BookDataRecord)[],
    records: BookDataRecord[],
  ) => {
    // Initialize an array to store authoritative records from the server.
    const authoritativeRecords: BookDataRecord[] = [];

     // Iterate over each record to process it for upsertion.
    for (const rec of records) {
       // Transform the client-side record into a database-compatible format.
      const dbRec = transformsToDB[table](rec, user.id);
      // Set the user_id and book_hash on the record for matching and reference.
      rec.user_id = user.id;
      rec.book_hash = dbRec.book_hash;
      // Prepare matching conditions for the database query.
      const matchConditions: Record<string, string | number> = { user_id: user.id };
      for (const pk of primaryKeys) {
        matchConditions[pk] = rec[pk]!;
      }

      const { data: serverData, error: fetchError } = await supabase
        .from(table)
        .select()
        .match(matchConditions)
        .single();
      // If a fetch error occurs that is not 'PGRST116' (no record found), return an error.
      if (fetchError && fetchError.code !== 'PGRST116') {
        return { error: fetchError.message };
      }
      // If no server record is found, insert the record as new.
      if (!serverData) {
        // Set the updated_at to the current time for new records.
        dbRec.updated_at = new Date().toISOString();
         // Insert the new record.
        const { data: inserted, error: insertError } = await supabase
          .from(table)
          .insert(dbRec)
          .select()
          .single();
         // Log the insertion for debugging.
        console.log('Inserted record:', inserted);
        // If there is an error during insertion, return the error.
        if (insertError) return { error: insertError.message };
        // Add the inserted record to the authoritativeRecords.
        authoritativeRecords.push(inserted);
      } else {
        const clientUpdatedAt = dbRec.updated_at ? new Date(dbRec.updated_at).getTime() : 0;
        const serverUpdatedAt = serverData.updated_at
          ? new Date(serverData.updated_at).getTime()
          : 0;
        const clientDeletedAt = dbRec.deleted_at ? new Date(dbRec.deleted_at).getTime() : 0;
        const serverDeletedAt = serverData.deleted_at
          ? new Date(serverData.deleted_at).getTime()
          : 0;
          // Determine if the client has a newer version of the record.
        const clientIsNewer =
          clientDeletedAt > serverDeletedAt || clientUpdatedAt > serverUpdatedAt;
          // If the client is newer, update the server record.
        if (clientIsNewer) {
          const { data: updated, error: updateError } = await supabase
            .from(table)
            .update(dbRec)
            .match(matchConditions)
            .select()
           .single();
          // Log the update for debugging.
          console.log('Updated record:', updated);
          // If there's an error during update, return the error.

          if (updateError) return { error: updateError.message };
          authoritativeRecords.push(updated);
        } else {
          authoritativeRecords.push(serverData);
        }
      }
    }
    // Return the array of authoritative records.
    return { data: authoritativeRecords };
  };

  try {
     const [booksResult, configsResult, notesResult] = await Promise.all([
      upsertRecords('books', ['book_hash'], books as BookDataRecord[]),
      upsertRecords('book_configs', ['book_hash'], configs as BookDataRecord[]),
      upsertRecords('book_notes', ['book_hash', 'id'], notes as BookDataRecord[]),
    ]);

    if (booksResult?.error) throw new Error(booksResult.error);
    if (configsResult?.error) throw new Error(configsResult.error);
    if (notesResult?.error) throw new Error(notesResult.error);
     // Return the results from the upsert operations.
    return NextResponse.json(
      {
        books: booksResult?.data || [],
        configs: configsResult?.data || [],
        notes: notesResult?.data || [],
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    // Log the error and return an error response.
    console.error(error);
    const errorMessage = (error as PostgrestError).message || 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    // Check if the request URL is valid.
  if (!req.url) {
    return res.status(400).json({ error: 'Invalid request URL' });
  }
  // Determine the protocol and host from environment variables or default values.
  const protocol = process.env['PROTOCOL'] || 'http';
  const host = process.env['HOST'] || 'localhost:3000';
  // Construct a URL object from the request URL and the determined protocol and host.
  const url = new URL(req.url, `${protocol}://${host}`);
  // Run CORS middleware to handle cross-origin requests.
  await runMiddleware(req, res, corsAllMethods);

  try {
    // Initialize a variable to store the response.
    let response: Response;
    // Handle GET requests by creating a NextRequest and calling the GET function.
    // GET requests are used to retrieve data.
    
    if (req.method === 'GET') {
      const nextReq = new NextRequest(url.toString(), {
        headers: new Headers(req.headers as Record<string, string>),
        method: 'GET',
      });
      response = await GET(nextReq);
    } else if (req.method === 'POST') {
      // Handle POST requests by creating a NextRequest, including the request body, and calling the POST function.
      // POST requests are used to upsert data.
      const nextReq = new NextRequest(url.toString(), {
        headers: new Headers(req.headers as Record<string, string>),
        method: 'POST',
        body: JSON.stringify(req.body), // Ensure the body is a string
      });
      response = await POST(nextReq);
    } else {
      // Handle other HTTP methods by setting the 'Allow' header and sending a 405 error.
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    // Set the status code of the response.
    res.status(response.status);
    // Copy headers from the Next.js Response to the Next.js API Response.
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    // Convert the response body to an ArrayBuffer.
    const arrayBuffer = await response.arrayBuffer();
    // Convert the ArrayBuffer to a Buffer.
    const buffer = Buffer.from(arrayBuffer);
     // Send the response body.
    res.send(buffer);
  } catch (error) {
     // Log any errors that occur during request processing.
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
