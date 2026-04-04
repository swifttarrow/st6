import { mount } from './index';
import type { HostContext } from './types/host-context';

declare global {
  interface Window {
    __WCT_HOST_CONTEXT__?: Partial<HostContext>;
  }
}

function renderBootstrapError(container: HTMLElement): void {
  container.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:32px;background:linear-gradient(180deg,#f4efe4 0%,#fffdf8 100%);color:#1f2937;font-family:Georgia,serif;">
      <section style="max-width:720px;padding:32px;border:1px solid rgba(31,41,55,0.12);border-radius:24px;background:rgba(255,255,255,0.92);box-shadow:0 18px 40px rgba(31,41,55,0.08);">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8b5e3c;">Host Context Required</p>
        <h1 style="margin:0 0 16px;font-size:32px;line-height:1.15;">This build no longer provides a local login screen.</h1>
        <p style="margin:0 0 12px;font-size:17px;line-height:1.6;">Mount the micro-frontend from the host app or inject <code>window.__WCT_HOST_CONTEXT__</code> with a valid JWT-backed context before loading the page.</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">Required fields: <code>accessToken</code>, <code>userId</code>, <code>role</code>, and <code>teamId</code>.</p>
      </section>
    </main>
  `;
}

function isValidRole(role: unknown): role is HostContext['role'] {
  return role === 'IC' || role === 'MANAGER' || role === 'LEADERSHIP';
}

function resolveHostContext(candidate: Partial<HostContext> | undefined): HostContext | null {
  if (!candidate) {
    return null;
  }

  const accessToken = typeof candidate.accessToken === 'string' ? candidate.accessToken.trim() : '';
  const userId = typeof candidate.userId === 'string' ? candidate.userId.trim() : '';
  const teamId = typeof candidate.teamId === 'string' ? candidate.teamId.trim() : '';

  if (!accessToken || !userId || !teamId || !isValidRole(candidate.role)) {
    return null;
  }

  return {
    accessToken,
    userId,
    role: candidate.role,
    teamId,
    managerId:
      typeof candidate.managerId === 'string' && candidate.managerId.trim()
        ? candidate.managerId.trim()
        : undefined,
    directReportIds: Array.isArray(candidate.directReportIds)
      ? candidate.directReportIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      : undefined,
  };
}

const container = document.getElementById('app');
if (!container) {
  throw new Error('Missing #app element');
}

const context = resolveHostContext(window.__WCT_HOST_CONTEXT__);
if (!context) {
  renderBootstrapError(container);
} else {
  mount(container, context);
}
