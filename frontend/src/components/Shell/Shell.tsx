import React from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { useUserContext } from '../../context/UserContext';
import styles from './Shell.module.css';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const { role } = useUserContext();

  return (
    <div className={styles.shell}>
      <Sidebar userRole={role} />
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};
