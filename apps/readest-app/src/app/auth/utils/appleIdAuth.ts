// Import the 'invoke' function from the Tauri API core for invoking commands.
import { invoke } from '@tauri-apps/api/core';

// Define the possible scopes for the Apple ID authorization request.
// 'fullName' scope requests the user's full name.
// 'email' scope requests the user's email address.
export type Scope = 'fullName' | 'email';

// Define the interface for the Apple ID authorization request.
export interface AppleIDAuthorizationRequest {
  // An array of scopes to request from Apple.
  scope: Scope[];
  // A random string used to prevent replay attacks. Optional.
  nonce?: string;
  // A string that can be used to maintain state between the request and the response. Optional.
  state?: string;
}

// Define the interface for the Apple ID authorization response.
export interface AppleIDAuthorizationResponse {
  // The user's unique identifier from Apple. Usually not null.
  userIdentifier: string | null;

  // The user's given name. Can be null if the user has not provided it.
  givenName: string | null;
  // The user's family name. Can be null if the user has not provided it.
  familyName: string | null;
  // The user's email address. Can be null if the user has not provided it.
  email: string | null;

  // The authorization code received from Apple.
  authorizationCode: string;
  // The identity token received from Apple. Can be null in certain cases.
  identityToken: string | null;
  // The state value returned by Apple, if provided in the request. Can be null.
  state: string | null;
}

/**
 * Asynchronously requests Apple ID authorization using Tauri's invoke function.
 *
 * This function sends a request to the native side of the Tauri application to
 * initiate the "Sign in with Apple" flow. It then waits for the response from
 * the native side, which contains the Apple ID credentials.
 *
 * @param request - The AppleIDAuthorizationRequest object containing the
 *                  requested scopes, nonce, and state.
 * @returns A Promise that resolves to an AppleIDAuthorizationResponse object
 *          containing the Apple ID credentials.
 */
export async function getAppleIdAuth(
  request: AppleIDAuthorizationRequest,
): Promise<AppleIDAuthorizationResponse> {
  // Invoke the native Tauri command 'get_apple_id_credential' to initiate the Apple ID sign-in.
  const result = await invoke<AppleIDAuthorizationResponse>(
    'plugin:sign-in-with-apple|get_apple_id_credential',
    {
      // Pass the request payload to the native side.
      payload: request,
    },
  );
  // Return the Apple ID authorization response received from the native side.
  return result;
}
