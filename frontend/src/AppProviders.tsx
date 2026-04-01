import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HostContext } from './types/host-context';
import { UserContextProvider } from './context/UserContext';
import { ApiProvider } from './context/ApiContext';
import './styles/tokens.css';
import './styles/reset.css';
import './styles/typography.css';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.DEV ? '' : 'http://localhost:8080');

export interface AppProvidersProps {
  context: HostContext;
  children: React.ReactNode;
}

export function AppProviders({ context, children }: AppProvidersProps): React.ReactElement {
  return (
    <UserContextProvider context={context}>
      <ApiProvider baseUrl={API_BASE_URL} userContext={context}>
        <BrowserRouter>{children}</BrowserRouter>
      </ApiProvider>
    </UserContextProvider>
  );
}

export { API_BASE_URL };
