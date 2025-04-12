import { NextApiRequest, NextApiResponse } from 'next';
import { corsAllMethods, runMiddleware } from '@/utils/cors';
import { supabase } from '@/utils/supabase';
import { getUserPlan } from '@/utils/access';
import { query as deeplQuery } from '@/utils/deepl';

// Default DeepL API endpoints for free and pro accounts.
const DEFAULT_DEEPL_FREE_API = 'https://api-free.deepl.com/v2/translate';
const DEFAULT_DEEPL_PRO_API = 'https://api.deepl.com/v2/translate';

/**
 * Fetches the user and their authentication token from the Supabase database.
 * @param authHeader The Authorization header containing the bearer token.
 * @returns An object containing the user and token, or an empty object if not found.
 */
const getUserAndToken = async (authHeader: string | undefined) => {
  // If there is no authentication header, return an empty object.
  if (!authHeader) return {};

  // Extract the token from the Authorization header.
  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  // If there is an error or no user, return an empty object.
  if (error || !user) return {};
  // Return the user and token if found.
  return { user, token };
};

/**
 * Retrieves a random DeepL API key from a comma-separated list of keys.
 * @param keys A string containing comma-separated DeepL API keys.
 * @returns A randomly selected DeepL API key or an empty string if no keys are provided.
 */
const getDeepLAPIKey = (keys: string | undefined) => {
  const keyArray = keys?.split(',') ?? [];
  return keyArray.length ? keyArray[Math.floor(Math.random() * keyArray.length)] : '';
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await runMiddleware(req, res, corsAllMethods);
  // Check if the request method is POST, otherwise return a 405 error.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the user and token from the authentication header.
  const { user, token } = await getUserAndToken(req.headers['authorization']);

  // Get the DeepL API URLs from environment variables or use the default ones.
  const { DEEPL_PRO_API, DEEPL_FREE_API } = process.env;
  const deepFreeApiUrl = DEEPL_FREE_API || DEFAULT_DEEPL_FREE_API;
  const deeplProApiUrl = DEEPL_PRO_API || DEFAULT_DEEPL_PRO_API;

  // Determine which DeepL API URL to use based on the user's plan.
  let deeplApiUrl = deepFreeApiUrl;
  let userPlan = 'free';
  if (user && token) {
    // Determine user plan (pro or free) based on the provided token.
    userPlan = getUserPlan(token);
    // If the user has a pro plan, use the pro DeepL API URL.
    if (userPlan === 'pro') deeplApiUrl = deeplProApiUrl;
  } else {
    // If no user or token is found, return a 403 error.
    res.status(403).json({ error: 'Not authenticated' });
  }
  // Determine which set of API keys to use based on the DeepL API URL, then
  // Retrieve a DeepL API key.
  const deeplAuthKey =
    deeplApiUrl === deeplProApiUrl
      ? getDeepLAPIKey(process.env['DEEPL_PRO_API_KEYS'])
      : getDeepLAPIKey(process.env['DEEPL_FREE_API_KEYS']);

  const {
    text,
    source_lang: sourceLang = 'auto',
    target_lang: targetLang = 'en',
  }: { text: string[]; source_lang: string; target_lang: string } = req.body;
  try {
    // if user and token are provided try to proxy the request to deepl api
    if (user && token) {
      console.log('deeplApiUrl', deeplApiUrl);
      // proxy request to deepL
      const response = await fetch(deeplApiUrl, {
        method: 'POST',
        headers: {
          // set deepl key
          Authorization: `DeepL-Auth-Key ${deeplAuthKey}`,
          // the `x-fingerprint` header should be included in every
          // DeepL API request, you can generate it using https://github.com/huggingface/peft/blob/main/src/peft/utils/other.py#L68
          'x-fingerprint': process.env['DEEPL_X_FINGERPRINT'] || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      res.status(response.status);
      res.json(await response.json());
      // if no user and token fallback to use direct request
    } else {
      const result = await deeplQuery({
        // direct deepL request
        text: text[0] ?? '',
        sourceLang,
        targetLang,
      });
      res.status(200).json(result);
    }
  } catch (error) {
    console.error('Error proxying DeepL request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
