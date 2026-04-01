import React, { useCallback, useState } from 'react';
import { AppProviders } from './AppProviders';
import { Shell } from './components/Shell/Shell';
import { AppRouter } from './router';
import { DevLoginPage } from './pages/DevLogin/DevLoginPage';
import type { HostContext } from './types/host-context';
import { loadDevSession } from './dev/devSession';

/**
 * Dev entry: login screen + session persistence. Production host apps call `mount()` with context instead.
 */
export const DevApp: React.FC = () => {
  const [context, setContext] = useState<HostContext | null>(() => loadDevSession());

  const handleLoggedIn = useCallback((ctx: HostContext) => {
    setContext(ctx);
  }, []);

  if (!context) {
    return <DevLoginPage onLoggedIn={handleLoggedIn} />;
  }

  return (
    <AppProviders context={context}>
      <Shell>
        <AppRouter />
      </Shell>
    </AppProviders>
  );
};
