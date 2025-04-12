'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { EnvConfigType } from '../services/environment';
import env from '../services/environment';
import { AppService } from '@/types/system';

// Define the structure of the environment context.
interface EnvContextType {
  envConfig: EnvConfigType; // Configuration settings for the environment.
  appService: AppService | null; // Service instance for application-level operations.
}

// Create a context for sharing environment-related data.
const EnvContext = createContext<EnvContextType | undefined>(undefined);

// Define the provider component for the environment context.
export const EnvProvider = ({ children }: { children: ReactNode }) => {
  // Initialize the environment configuration state.
  // It is set using the 'env' object imported from 'environment.ts'.
  const [envConfig] = useState<EnvConfigType>(env);

  // Initialize the application service state to null.
  // This service will be populated asynchronously.
  const [appService, setAppService] = useState<AppService | null>(null);

  // useEffect hook to asynchronously initialize the application service.
  useEffect(() => {
    // Call the getAppService method from envConfig.
    // When the promise resolves, set the appService state.
    envConfig.getAppService().then((service) => {
      setAppService(service);
    });
    // The effect depends on envConfig. It will re-run if envConfig changes.
  }, [envConfig]);

  // Provide the environment configuration and application service to the children components.
  return (
    <EnvContext.Provider value={{ envConfig, appService }}>
      {children}
    </EnvContext.Provider>
  );
};

// Custom hook to access the environment context.
export const useEnv = (): EnvContextType => {
  // Use the useContext hook to consume the context.
  const context = useContext(EnvContext);
  // Throw an error if useEnv is used outside of EnvProvider.
  if (!context) throw new Error('useEnv must be used within EnvProvider');
  // Return the environment context value.
  return context;
};
