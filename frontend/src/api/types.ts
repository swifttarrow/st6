// ── RCDO Domain Types ──

export interface RallyCry {
  id: string;
  title: string;
  description: string;
  archived: boolean;
}

export interface DefiningObjective {
  id: string;
  rallyCryId: string;
  title: string;
  description: string;
  archived: boolean;
}

export interface Outcome {
  id: string;
  definingObjectiveId: string;
  title: string;
  description: string;
  archived: boolean;
}

// ── RCDO Tree Types ──

export interface RcdoTreeOutcome {
  id: string;
  title: string;
  archived: boolean;
}

export interface RcdoTreeDefiningObjective {
  id: string;
  title: string;
  archived: boolean;
  outcomes: RcdoTreeOutcome[];
}

export interface RcdoTreeRallyCry {
  id: string;
  title: string;
  archived: boolean;
  definingObjectives: RcdoTreeDefiningObjective[];
}

export interface OutcomeSearchResult {
  outcomeId: string;
  outcomeTitle: string;
  definingObjectiveTitle: string;
  rallyCryTitle: string;
}

// ── Plan Types ──

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'RECONCILING' | 'DONE';

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
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

export type ActualStatus = 'DONE' | 'PARTIAL' | 'MISSED' | 'PENDING';

export interface Commitment {
  id: string;
  planId: string;
  outcomeId: string;
  title: string;
  sortOrder: number;
  actualStatus: ActualStatus;
  carriedForward: boolean;
  outcomeArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommitmentRequest {
  outcomeId: string;
  title: string;
}

export interface UpdateCommitmentRequest {
  title: string;
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
