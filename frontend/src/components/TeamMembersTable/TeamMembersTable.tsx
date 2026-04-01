import React from 'react';
import { Badge, BadgeVariant } from '../Badge/Badge';
import { TeamMemberSummary } from '../../api/types';
import styles from './TeamMembersTable.module.css';

interface TeamMembersTableProps {
  members: TeamMemberSummary[];
  onViewPlan: (planId: string) => void;
  onUnlock: (planId: string) => void;
}

const AVATAR_COLORS = [
  '#E42313', '#2563EB', '#16A34A', '#9333EA',
  '#EA580C', '#0891B2', '#4F46E5', '#C026D3',
  '#D97706', '#059669',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitial(userId: string): string {
  return userId.charAt(0).toUpperCase();
}

function getStatusBadge(status: string | null): { label: string; variant: BadgeVariant } | null {
  if (!status) return null;
  switch (status) {
    case 'LOCKED':
      return { label: 'Locked', variant: 'success' };
    case 'DRAFT':
      return { label: 'Draft', variant: 'default' };
    case 'RECONCILING':
      return { label: 'Reconciling', variant: 'alert' };
    case 'RECONCILED':
      return { label: 'Done', variant: 'success' };
    default:
      return { label: status, variant: 'default' };
  }
}

export const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  members,
  onViewPlan,
  onUnlock,
}) => {
  return (
    <div className={styles.container} data-testid="team-members-table">
      <div className={styles.header}>
        <span className={styles.headerTitle}>Team Members</span>
        <Badge label={String(members.length)} variant="default" />
      </div>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tableHeaderRow}>
            <th className={styles.th}>Member</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Commits</th>
            <th className={styles.th}>Top Rally Cry</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const badge = getStatusBadge(member.planStatus);
            const avatarColor = getAvatarColor(member.userId);
            const isLocked = member.planStatus === 'LOCKED';

            return (
              <tr
                key={member.userId}
                className={styles.row}
                onClick={() => member.planId && onViewPlan(member.planId)}
                data-testid={`member-row-${member.userId}`}
                role="button"
                tabIndex={0}
              >
                <td className={styles.td}>
                  <div className={styles.memberCell}>
                    <div
                      className={styles.avatar}
                      style={{ backgroundColor: avatarColor }}
                    >
                      {getInitial(member.userId)}
                    </div>
                    <span className={styles.memberName}>{member.userId}</span>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.statusCell}>
                    {badge ? (
                      <Badge label={badge.label} variant={badge.variant} />
                    ) : (
                      <span className={styles.noPlan}>No Plan</span>
                    )}
                    {isLocked && member.planId && (
                      <button
                        className={styles.unlockButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnlock(member.planId!);
                        }}
                        type="button"
                        data-testid={`unlock-${member.userId}`}
                      >
                        Unlock
                      </button>
                    )}
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={styles.commitCount}>{member.commitmentCount}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.rallyCry}>
                    {member.topRallyCry ?? '\u2014'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
