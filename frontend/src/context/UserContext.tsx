import React, { createContext, useContext } from 'react';
import { HostContext } from '../types/host-context';

const UserContext = createContext<HostContext | null>(null);

interface UserContextProviderProps {
  context: HostContext;
  children: React.ReactNode;
}

export const UserContextProvider: React.FC<UserContextProviderProps> = ({
  context,
  children,
}) => {
  return (
    <UserContext.Provider value={context}>
      {children}
    </UserContext.Provider>
  );
};

export function useUserContext(): HostContext {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return ctx;
}
