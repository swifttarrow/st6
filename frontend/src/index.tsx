import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { HostContext } from './types/host-context';
import { AppProviders } from './AppProviders';
import { Shell } from './components/Shell/Shell';
import { AppRouter } from './router';

export type { HostContext };
export { useUserContext } from './context/UserContext';
export { useApi } from './context/ApiContext';
export { Shell } from './components/Shell/Shell';
export { PageHeader } from './components/PageHeader/PageHeader';
export { Badge } from './components/Badge/Badge';
export type { BadgeVariant } from './components/Badge/Badge';
export { AppProviders } from './AppProviders';

let root: Root | null = null;

export function mount(container: HTMLElement, context: HostContext): void {
  root = createRoot(container);
  root.render(
    <AppProviders context={context}>
      <Shell>
        <AppRouter />
      </Shell>
    </AppProviders>,
  );
}

export function unmount(): void {
  if (root) {
    root.unmount();
    root = null;
  }
}
