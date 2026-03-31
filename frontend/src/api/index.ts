export type {
  RallyCry,
  DefiningObjective,
  Outcome,
  RcdoTreeRallyCry,
  RcdoTreeDefiningObjective,
  RcdoTreeOutcome,
  OutcomeSearchResult,
  PlanStatus,
  WeeklyPlan,
  PlanTransition,
  ActualStatus,
  Commitment,
  CreateCommitmentRequest,
  UpdateCommitmentRequest,
  ReconcileItemRequest,
  TeamOverviewResponse,
  TeamMemberSummary,
  RallyCryCoverage,
  OrgOverviewResponse,
  RcdoHierarchyCoverage,
} from './types';
export { ApiError } from './types';

export { createApiClient } from './client';
export type { ApiClient } from './client';

export { createRcdoApi } from './rcdo';
export type { RcdoApi } from './rcdo';

export { createPlansApi } from './plans';
export type { PlansApi } from './plans';

export { createCommitmentsApi } from './commitments';
export type { CommitmentsApi } from './commitments';

export { createDashboardApi } from './dashboard';
export type { DashboardApi } from './dashboard';

import { HostContext } from '../types/host-context';
import { createApiClient } from './client';
import { createRcdoApi, RcdoApi } from './rcdo';
import { createPlansApi, PlansApi } from './plans';
import { createCommitmentsApi, CommitmentsApi } from './commitments';
import { createDashboardApi, DashboardApi } from './dashboard';

export interface Api {
  rcdo: RcdoApi;
  plans: PlansApi;
  commitments: CommitmentsApi;
  dashboard: DashboardApi;
}

export function createApi(baseUrl: string, userContext: HostContext): Api {
  const client = createApiClient(baseUrl, userContext);
  return {
    rcdo: createRcdoApi(client),
    plans: createPlansApi(client),
    commitments: createCommitmentsApi(client),
    dashboard: createDashboardApi(client),
  };
}
