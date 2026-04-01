import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import type { WeeklyPlan } from '../api/types';

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Matches ReconciliationPage: LOCKED (will transition), RECONCILING, RECONCILED stay on page. */
function isPlanEligibleForReconciliationPage(plan: WeeklyPlan): boolean {
  if (plan.status === 'LOCKED') return true;
  if (plan.status === 'RECONCILING' || plan.status === 'RECONCILED') return true;
  return false;
}

const RECONCILIATION_DISABLED_TITLE =
  'Reconciliation opens after you lock your week on Commitments (or if a plan exists for today).';

export function useReconciliationNavAvailable(): {
  enabled: boolean;
  loading: boolean;
  disabledTitle: string;
} {
  const api = useApi();
  const location = useLocation();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const plan = await api.plans.getPlan(getTodayDate());
        if (!cancelled) {
          setEnabled(isPlanEligibleForReconciliationPage(plan));
        }
      } catch {
        if (!cancelled) {
          setEnabled(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [api, location.pathname]);

  return {
    enabled,
    loading,
    disabledTitle: RECONCILIATION_DISABLED_TITLE,
  };
}
