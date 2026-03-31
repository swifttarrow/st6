import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HostContext } from './types/host-context';
import { UserContextProvider } from './context/UserContext';
import { ApiProvider } from './context/ApiContext';
import { Shell } from './components/Shell/Shell';
import { AppRouter } from './router';
import './styles/tokens.css';
import './styles/reset.css';
import './styles/typography.css';

export type { HostContext };
export { useUserContext } from './context/UserContext';
export { useApi } from './context/ApiContext';
export { Shell } from './components/Shell/Shell';
export { PageHeader } from './components/PageHeader/PageHeader';
export { Badge } from './components/Badge/Badge';
export type { BadgeVariant } from './components/Badge/Badge';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.DEV ? '' : 'http://localhost:8080');

let root: Root | null = null;

export function mount(container: HTMLElement, context: HostContext): void {
  root = createRoot(container);
  root.render(
    <UserContextProvider context={context}>
      <ApiProvider baseUrl={API_BASE_URL} userContext={context}>
        <BrowserRouter>
          <Shell>
            <AppRouter />
          </Shell>
        </BrowserRouter>
      </ApiProvider>
    </UserContextProvider>
  );
}

export function unmount(): void {
  if (root) {
    root.unmount();
    root = null;
  }
}
