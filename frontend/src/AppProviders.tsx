import React from 'react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
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
  router?: AppRouterConfig;
}

export type AppRouterConfig =
  | {
      type?: 'browser';
      basename?: string;
    }
  | {
      type: 'memory';
      initialEntries?: string[];
      initialIndex?: number;
    };

function renderWithinRouter(children: React.ReactNode, router: AppRouterConfig | undefined): React.ReactElement {
  if (router?.type === 'memory') {
    return (
      <MemoryRouter initialEntries={router.initialEntries} initialIndex={router.initialIndex}>
        {children}
      </MemoryRouter>
    );
  }

  const basename = router?.type === 'browser' ? router.basename : undefined;
  return <BrowserRouter basename={basename}>{children}</BrowserRouter>;
}

export function AppProviders({ context, children, router }: AppProvidersProps): React.ReactElement {
  return (
    <UserContextProvider context={context}>
      <ApiProvider baseUrl={API_BASE_URL} userContext={context}>
        {renderWithinRouter(children, router)}
      </ApiProvider>
    </UserContextProvider>
  );
}

export { API_BASE_URL };
