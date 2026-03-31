import { ApiClient } from './client';
import { WeeklyPlan, PlanStatus, PlanTransition } from './types';

export interface PlansApi {
  getPlan(date: string): Promise<WeeklyPlan>;
  getPlanById(planId: string): Promise<WeeklyPlan>;
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
