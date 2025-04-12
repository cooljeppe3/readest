'use client';

// Import necessary modules from React and Supabase.
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import posthog from 'posthog-js';

// Define the interface for the AuthContext.
interface AuthContextType {
  // Represents the authentication token.
  token: string | null;
  // Represents the authenticated user.
  user: User | null;
  // Function to handle user login.
  login: (token: string, user: User) => void;
  // Function to handle user logout.
  logout: () => void;
}

// Create a context for authentication data.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component provides authentication data to its children.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // State variable to hold the authentication token.
  // Initialized from localStorage if available.
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });

  // State variable to hold the user information.
  // Initialized from localStorage if available.
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('user');
      // Parse the JSON string to get the user object.
      return userJson ? JSON.parse(userJson) : null;
    }
    return null;
  });

  // useEffect hook to manage authentication state changes.
  useEffect(() => {
    // Function to synchronize the session data.
    const syncSession = (
      session: { access_token: string; refresh_token: string; user: User } | null,
    ) => {
      if (session) {
        console.log('Syncing session');
        // Destructure the session object.
        const { access_token, refresh_token, user } = session;
        // Store token, refresh token, and user data in localStorage.
        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(user));
        // Identify the user in PostHog.
        posthog.identify(user.id);
        // Update the token state.
        setToken(access_token);
        // Update the user state.
        setUser(user);
      } else {
        console.log('Clearing session');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    };

    // Function to refresh the session.
    const refreshSession = async () => {
      try {
        // Attempt to refresh the session with Supabase.
        await supabase.auth.refreshSession();
      } catch {
        // If refresh fails, clear the session.
        syncSession(null);
      }
    };

    // Listen for authentication state changes.
    const { data: subscription } = supabase.auth.onAuthStateChange((_, session) => {
      // Synchronize the session whenever the state changes.
      syncSession(session);
    });

    // Attempt to refresh the session on component mount.
    refreshSession();
    // Cleanup function to unsubscribe from auth state changes.
    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  // Function to handle user login.
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      // Attempt to refresh the session before signing out.
      await supabase.auth.refreshSession();
    } catch {
    } finally {
      // Sign the user out from Supabase.
      await supabase.auth.signOut();
      // Remove auth-related items from localStorage.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Clear the token and user states.
      setToken(null);
      setUser(null);
    }
  };

  // Provide the context value to children.
  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use the authentication context.
export const useAuth = (): AuthContextType => {
  // Get the context value.
  const context = useContext(AuthContext);
  // Throw an error if used outside of AuthProvider.
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
