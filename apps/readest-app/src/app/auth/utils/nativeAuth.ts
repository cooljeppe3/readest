// Import the 'invoke' function from the Tauri API, which allows invoking commands defined in the native Rust code.
import { invoke } from '@tauri-apps/api/core';

// Define the structure for an authentication request.
export interface AuthRequest {
  // The URL to which the user should be redirected to initiate the authentication process.
  authUrl: string;
}

// Define the structure for an authentication response.
export interface AuthResponse {
  // The URL to which the user is redirected after completing the authentication process.
  redirectUrl: string;
}

// Function to perform authentication using Safari (on iOS) or a similar in-app browser on other platforms.
export async function authWithSafari(request: AuthRequest): Promise<AuthResponse> {
  // Invoke a native command ('plugin:native-bridge|auth_with_safari') to start the authentication process in Safari.
  // This command is handled by the native Rust plugin.
  // 'payload' is a key used by the plugin to receive parameters
  // The generic type <AuthResponse> specifies that the command returns an object of type AuthResponse.
  const result = await invoke<AuthResponse>('plugin:native-bridge|auth_with_safari', {
    // Pass the authentication request to the native plugin.
    payload: request,
  });

  // Return the authentication response received from the native plugin.
  return result;
}

// Function to perform authentication using a custom tab (on Android) or a similar in-app browser on other platforms.
export async function authWithCustomTab(request: AuthRequest): Promise<AuthResponse> {
  // Invoke a native command ('plugin:native-bridge|auth_with_custom_tab') to start the authentication process in a custom tab.
  // This command is handled by the native Rust plugin.
  // 'payload' is a key used by the plugin to receive parameters
  // The generic type <AuthResponse> specifies that the command returns an object of type AuthResponse.
  const result = await invoke<AuthResponse>('plugin:native-bridge|auth_with_custom_tab', {
    // Pass the authentication request to the native plugin.
    payload: request,
  });

  // Return the authentication response received from the native plugin.
  return result;
}
