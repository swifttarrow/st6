import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WeeklyPlanningPage } from './pages/WeeklyPlanning/WeeklyPlanningPage';
import { ReconciliationPage } from './pages/Reconciliation/ReconciliationPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { ManagerDashboardPage } from './pages/ManagerDashboard/ManagerDashboardPage';
import { LeadershipViewPage } from './pages/LeadershipView/LeadershipViewPage';
import { ExecutiveOverviewPage } from './pages/ExecutiveOverview/ExecutiveOverviewPage';
import { StrategyManagementPage } from './pages/StrategyManagement/StrategyManagementPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/commitments" element={<WeeklyPlanningPage />} />
      <Route path="/my-week" element={<Navigate to="/commitments" replace />} />
      <Route path="/reconciliation" element={<ReconciliationPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/team" element={<ManagerDashboardPage />} />
      <Route path="/leadership" element={<LeadershipViewPage />} />
      <Route path="/executive" element={<ExecutiveOverviewPage />} />
      <Route path="/leadership/executive" element={<Navigate to="/executive" replace />} />
      <Route path="/strategy" element={<StrategyManagementPage />} />
      <Route path="*" element={<Navigate to="/commitments" replace />} />
    </Routes>
  );
};
