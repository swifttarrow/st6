import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WeeklyPlanningPage } from './pages/WeeklyPlanning/WeeklyPlanningPage';
import { ReconciliationPage } from './pages/Reconciliation/ReconciliationPage';
import { ManagerDashboardPage } from './pages/ManagerDashboard/ManagerDashboardPage';
import { LeadershipViewPage } from './pages/LeadershipView/LeadershipViewPage';
import { StrategyManagementPage } from './pages/StrategyManagement/StrategyManagementPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/my-week" element={<WeeklyPlanningPage />} />
      <Route path="/reconciliation" element={<ReconciliationPage />} />
      <Route path="/team" element={<ManagerDashboardPage />} />
      <Route path="/leadership" element={<LeadershipViewPage />} />
      <Route path="/strategy" element={<StrategyManagementPage />} />
      <Route path="*" element={<Navigate to="/my-week" replace />} />
    </Routes>
  );
};
