import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApi } from '../context/ApiContext';
import type { WeeklyPlan } from '../api/types';
import { getMonday, getTodayDate } from '../utils/weekDates';

/** Matches ReconciliationPage: LOCKED (will transition), RECONCILING, RECONCILED stay on page. */
function isPlanEligibleForReconciliationPage(plan: WeeklyPlan): boolean {
  if (plan.status === 'LOCKED') return true;
  if (plan.status === 'RECONCILING' || plan.status === 'RECONCILED') return true;
  return false;
}

function effectiveWeekMonday(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  const w = params.get('week');
  if (w && (pathname === '/reconciliation' || pathname === '/commitments')) {
    return getMonday(w);
  }
  return getMonday(getTodayDate());
}

const RECONCILIATION_DISABLED_TITLE =
  'Reconciliation opens after you lock your week on Commitments.';

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
        const date = effectiveWeekMonday(location.pathname, location.search);
        const plan = await api.plans.getPlan(date);
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
  }, [api, location.pathname, location.search]);

  return {
    enabled,
    loading,
    disabledTitle: RECONCILIATION_DISABLED_TITLE,
  };
}
