import type { HostContext } from '../types/host-context';

const STORAGE_KEY = 'wct-dev-session';

function isRole(v: string): v is HostContext['role'] {
  return v === 'IC' || v === 'MANAGER' || v === 'LEADERSHIP';
}

export function loadDevSession(): HostContext | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Record<string, unknown>;
    const userId = typeof o.userId === 'string' ? o.userId.trim() : '';
    const teamId = typeof o.teamId === 'string' ? o.teamId.trim() : '';
    const roleRaw = typeof o.role === 'string' ? o.role.toUpperCase() : '';
    if (!userId || !teamId || !isRole(roleRaw)) return null;
    const ctx: HostContext = { userId, teamId, role: roleRaw };
    const mid = o.managerId;
    if (typeof mid === 'string' && mid.trim()) {
      ctx.managerId = mid.trim();
    }
    return ctx;
  } catch {
    return null;
  }
}

export function saveDevSession(context: HostContext): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

export function clearDevSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
