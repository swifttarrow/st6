import { ApiClient } from './client';
import { WeeklyPlan, PlanStatus, PlanTransition, MyPlanSummary } from './types';

export interface PlansApi {
  getPlan(date: string): Promise<WeeklyPlan>;
  getPlanById(planId: string): Promise<WeeklyPlan>;
  listMyPlans(from: string, to: string): Promise<MyPlanSummary[]>;
  transitionPlan(planId: string, targetStatus: PlanStatus): Promise<WeeklyPlan>;
  unlockPlan(planId: string): Promise<WeeklyPlan>;
  getTransitions(planId: string): Promise<PlanTransition[]>;
}

export function createPlansApi(client: ApiClient): PlansApi {
  return {
    getPlan(date: string): Promise<WeeklyPlan> {
      const encoded = encodeURIComponent(date);
      return client.get<WeeklyPlan>(`/api/plans?date=${encoded}`);
    },
    getPlanById(planId: string): Promise<WeeklyPlan> {
      return client.get<WeeklyPlan>(`/api/plans/${planId}`);
    },
    listMyPlans(from: string, to: string): Promise<MyPlanSummary[]> {
      const params = new URLSearchParams({ from, to });
      return client.get<MyPlanSummary[]>(`/api/plans/me?${params.toString()}`);
    },
    transitionPlan(planId: string, targetStatus: PlanStatus): Promise<WeeklyPlan> {
      return client.post<WeeklyPlan>(`/api/plans/${planId}/transition`, { targetStatus });
    },
    unlockPlan(planId: string): Promise<WeeklyPlan> {
      return client.post<WeeklyPlan>(`/api/plans/${planId}/unlock`);
    },
    getTransitions(planId: string): Promise<PlanTransition[]> {
      return client.get<PlanTransition[]>(`/api/plans/${planId}/transitions`);
    },
  };
}
