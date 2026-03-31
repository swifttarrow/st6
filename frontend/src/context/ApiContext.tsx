import React, { createContext, useContext, useMemo } from 'react';
import { HostContext } from '../types/host-context';
import { Api, createApi } from '../api';

const ApiContext = createContext<Api | null>(null);

interface ApiProviderProps {
  baseUrl: string;
  userContext: HostContext;
  children: React.ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({
  baseUrl,
  userContext,
  children,
}) => {
  const api = useMemo(
    () => createApi(baseUrl, userContext),
    [baseUrl, userContext],
  );

  return (
    <ApiContext.Provider value={api}>
      {children}
    </ApiContext.Provider>
  );
};

export function useApi(): Api {
  const api = useContext(ApiContext);
  if (!api) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return api;
}
