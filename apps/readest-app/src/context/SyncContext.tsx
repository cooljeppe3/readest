// 'use client' directive indicates that this module is intended to run in the client-side runtime environment.
'use client'; 

// Importing necessary modules from React and custom library.
import React, { createContext, useContext } from 'react';
import { SyncClient } from '@/libs/sync';

// Creating an instance of SyncClient to manage synchronization.
const syncClient = new SyncClient();

// Defining the structure of the SyncContext value.
interface SyncContextType {
  syncClient: SyncClient;
}

// Creating a React Context for synchronization.
// It is initialized with a default value that includes the syncClient instance.
// This ensures that if a component tries to use the context outside of a provider, it will still have access to a default syncClient.
const SyncContext = createContext<SyncContextType>({ syncClient });

// Defining the SyncProvider component.
// This component provides the SyncContext to its children.
// It uses a React Context Provider to pass the value down the component tree.
export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Returning the SyncContext Provider with the syncClient instance as its value.
  // Any component that is a child of this provider can access the syncClient through the useSyncContext hook.
  return <SyncContext.Provider value={{ syncClient }}>{children}</SyncContext.Provider>;
};

// Defining a custom hook to easily access the SyncContext.
// This hook utilizes the useContext hook to retrieve the context value.
export const useSyncContext = () => useContext(SyncContext);
// This hook can be used in any functional component that needs to use the syncClient, provided it is within the SyncProvider.
