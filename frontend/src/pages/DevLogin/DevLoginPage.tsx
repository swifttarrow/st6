import React, { useMemo, useState } from 'react';
import type { HostContext } from '../../types/host-context';
import { saveDevSession } from '../../dev/devSession';
import styles from './DevLoginPage.module.css';

const SEED_IC_USERS = ['alice', 'bob', 'carol', 'diana', 'frank', 'eve'] as const;
const TEAMS = [
  { id: 'team-alpha', label: 'team-alpha (most seed users)' },
  { id: 'team-beta', label: 'team-beta (eve)' },
] as const;

interface DevLoginPageProps {
  onLoggedIn: (ctx: HostContext) => void;
}

export const DevLoginPage: React.FC<DevLoginPageProps> = ({ onLoggedIn }) => {
  const [role, setRole] = useState<HostContext['role']>('IC');
  const [userId, setUserId] = useState('alice');
  const [teamId, setTeamId] = useState('team-alpha');
  const [managerId, setManagerId] = useState('mgr-1');
  const [error, setError] = useState<string | null>(null);

  const userOptions = useMemo(() => {
    if (role === 'IC') return [...SEED_IC_USERS];
    if (role === 'MANAGER') return ['mgr-1', 'manager-1', 'dev-manager'];
    return ['leader-1', 'admin'];
  }, [role]);

  const handleRoleChange = (next: HostContext['role']) => {
    setRole(next);
    setError(null);
    if (next === 'IC') setUserId('alice');
    else if (next === 'MANAGER') setUserId('mgr-1');
    else setUserId('leader-1');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const uid = userId.trim();
    const tid = teamId.trim();
    if (!uid) {
      setError('User ID is required.');
      return;
    }
    if (!tid) {
      setError('Team ID is required.');
      return;
    }
    const ctx: HostContext = { userId: uid, role, teamId: tid };
    if (role === 'MANAGER') {
      const mid = managerId.trim();
      if (mid) ctx.managerId = mid;
    }
    saveDevSession(ctx);
    onLoggedIn(ctx);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in (dev)</h1>
        <p className={styles.subtitle}>
          Local demo only. Chooses the identity sent as{' '}
          <code>X-User-Id</code> / <code>X-User-Role</code> to the API. No password.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="dev-role">
              Role
            </label>
            <select
              id="dev-role"
              className={styles.select}
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as HostContext['role'])}
            >
              <option value="IC">Individual contributor (IC)</option>
              <option value="MANAGER">Manager</option>
              <option value="LEADERSHIP">Leadership</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="dev-user">
              User ID
            </label>
            <input
              id="dev-user"
              className={styles.input}
              list="dev-user-options"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="username"
            />
            <datalist id="dev-user-options">
              {userOptions.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="dev-team">
              Team ID
            </label>
            <select
              id="dev-team"
              className={styles.select}
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              {TEAMS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {role === 'MANAGER' && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="dev-manager">
                Manager ID (optional header)
              </label>
              <input
                id="dev-manager"
                className={styles.input}
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
              />
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submit}>
            Continue
          </button>
        </form>

        <p className={styles.hint}>
          IC users <strong>alice</strong>–<strong>frank</strong> match seeded plans in{' '}
          <code>backend/scripts/seed.sql</code>. Use <strong>team-alpha</strong> for them;{' '}
          <strong>eve</strong> uses <strong>team-beta</strong>.
        </p>
      </div>
    </div>
  );
};
