import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Eye,
  List,
  CalendarDays,
  ClipboardCheck,
} from 'lucide-react';
import styles from './Sidebar.module.css';

type UserRole = 'IC' | 'MANAGER' | 'LEADERSHIP';

interface NavItem {
  path: string;
  label: string;
  minRole?: UserRole;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/my-week', label: 'My Week', icon: <CalendarDays size={16} strokeWidth={1.75} /> },
  {
    path: '/reconciliation',
    label: 'Reconciliation',
    icon: <ClipboardCheck size={16} strokeWidth={1.75} />,
  },
  {
    path: '/team',
    label: 'Team Dashboard',
    minRole: 'MANAGER',
    icon: <LayoutDashboard size={16} strokeWidth={1.75} />,
  },
  {
    path: '/leadership',
    label: 'Leadership View',
    minRole: 'LEADERSHIP',
    icon: <Eye size={16} strokeWidth={1.75} />,
  },
  {
    path: '/strategy',
    label: 'RCDO Management',
    minRole: 'MANAGER',
    icon: <List size={16} strokeWidth={1.75} />,
  },
];

const ROLE_HIERARCHY: Record<UserRole, number> = {
  IC: 0,
  MANAGER: 1,
  LEADERSHIP: 2,
};

interface SidebarProps {
  userRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();
  const roleLevel = ROLE_HIERARCHY[userRole];

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.minRole) return true;
    return roleLevel >= ROLE_HIERARCHY[item.minRole];
  });

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoSquare} />
        <span className={styles.logoText}>WCT</span>
      </div>

      <nav className={styles.nav}>
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.spacer} />

      <div className={styles.userInfo}>
        <span className={styles.userRole}>{userRole}</span>
      </div>
    </aside>
  );
};
