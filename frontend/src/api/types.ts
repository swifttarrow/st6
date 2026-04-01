// ── RCDO Domain Types ──

export interface RallyCry {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DefiningObjective {
  id: string;
  rallyCryId: string;
  name: string;
  description: string;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Outcome {
  id: string;
  definingObjectiveId: string;
  name: string;
  description: string;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── RCDO Tree Types ──

export interface RcdoTreeOutcome {
  id: string;
  name: string;
  description: string;
  archived?: boolean;
}

export interface RcdoTreeDefiningObjective {
  id: string;
  name: string;
  description: string;
  archived?: boolean;
  outcomes: RcdoTreeOutcome[];
}

export interface RcdoTreeRallyCry {
  id: string;
  name: string;
  description: string;
  archived?: boolean;
  definingObjectives: RcdoTreeDefiningObjective[];
}

export interface OutcomeSearchResult {
  outcomeId: string;
  outcomeName: string;
  definingObjectiveId: string;
  definingObjectiveName: string;
  rallyCryId: string;
  rallyCryName: string;
}

// ── RCDO Mutation Request Types ──

export interface CreateRallyCryRequest {
  name: string;
  description: string;
}

export interface UpdateRallyCryRequest {
  name: string;
  description: string;
  sortOrder?: number;
}

export interface CreateDefiningObjectiveRequest {
  rallyCryId: string;
  name: string;
  description: string;
}

export interface UpdateDefiningObjectiveRequest {
  name: string;
  description: string;
  sortOrder?: number;
}

export interface CreateOutcomeRequest {
  definingObjectiveId: string;
  name: string;
  description: string;
}

export interface UpdateOutcomeRequest {
  name: string;
  description: string;
  sortOrder?: number;
}

// ── Plan Types ──

export type PlanStatus = 'DRAFT' | 'LOCKED' | 'RECONCILING' | 'RECONCILED';

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

/** Existing plan row from `GET /api/plans/me` (no auto-create). */
export interface MyPlanSummary {
  id: string;
  weekStartDate: string;
  status: PlanStatus;
  commitmentCount: number;
}

export interface PlanTransition {
  id: string;
  planId: string;
  fromStatus: PlanStatus | null;
  toStatus: PlanStatus;
  transitionedBy: string;
  transitionedAt: string;
}

// ── Commitment Types ──

/** Matches backend `ActualStatus` JSON (enum names). */
export type ActualStatus =
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'NOT_STARTED'
  | 'DROPPED';

export interface Commitment {
  id: string;
  outcomeId: string;
  description: string;
  priority: number;
  notes: string | null;
  /** Null when not yet reconciled (matches API). */
  actualStatus: ActualStatus | null;
  carriedForward: boolean;
  outcomeArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommitmentRequest {
  outcomeId: string;
  description: string;
  notes?: string | null;
}

export interface UpdateCommitmentRequest {
  description?: string;
  outcomeId?: string;
  notes?: string | null;
}

export interface ReconcileItemRequest {
  commitmentId: string;
  actualStatus: ActualStatus;
}

// ── Dashboard Types ──

export interface TeamOverviewResponse {
  weekStartDate: string;
  stats: {
    directReports: number;
    plansLocked: number;
    totalCommitments: number;
    avgCompletionRate: number | null;
  };
  members: TeamMemberSummary[];
  rallyCryCoverage: RallyCryCoverage[];
}

export interface TeamMemberSummary {
  userId: string;
  planId: string | null;
  planStatus: string | null;
  commitmentCount: number;
  topRallyCry: string | null;
  completionRate: number | null;
}

export interface RallyCryCoverage {
  rallyCryId: string;
  rallyCryName: string;
  commitmentCount: number;
  memberCount: number;
  consecutiveZeroWeeks: number;
}

// ── Leadership Dashboard Types ──

export interface OrgOverviewResponse {
  weekStartDate: string;
  stats: {
    totalTeams: number;
    activeRallyCries: number;
    orgCommitments: number;
    coverageGaps: number;
  };
  hierarchy: RcdoHierarchyCoverage[];
}

export interface RcdoHierarchyCoverage {
  type: string;
  id: string;
  name: string;
  teamCount: number;
  totalTeams: number;
  commitmentCount: number;
  coveragePercent: number;
  status: string;
  consecutiveZeroWeeks?: number;
  warningNote?: string | null;
  children?: RcdoHierarchyCoverage[];
}

// ── Executive overview (leadership only) ──

export interface OrgLifecycleRollup {
  totalPlans: number;
  draftCount: number;
  lockedCount: number;
  reconcilingCount: number;
  reconciledCount: number;
  distinctUsers: number;
  distinctTeams: number;
  totalCommitments: number;
}

export interface WeekExecutionTrendRow {
  weekStartDate: string;
  totalPlans: number;
  draftCount: number;
  lockedCount: number;
  reconcilingCount: number;
  reconciledCount: number;
  totalCommitments: number;
}

export interface RallyCryPulseRow {
  rallyCryId: string;
  rallyCryName: string;
  commitmentCount: number;
  percentOfOrgCommitments: number;
}

export interface ExecutiveOverviewResponse {
  focusWeekStart: string;
  focusWeek: OrgLifecycleRollup;
  eightWeekTrend: WeekExecutionTrendRow[];
  rallyCryCommitmentMix: RallyCryPulseRow[];
}

// ── API Error ──

export class ApiError extends Error {
  public readonly status: number;
  public readonly error: string;

  constructor(status: number, error: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.error = error;
  }
}
