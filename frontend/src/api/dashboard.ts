import { ApiClient } from './client';
import { TeamOverviewResponse, OrgOverviewResponse, ExecutiveOverviewResponse } from './types';

export interface DashboardApi {
  getTeamOverview(date: string, memberIds: string[]): Promise<TeamOverviewResponse>;
  getOrgOverview(date: string): Promise<OrgOverviewResponse>;
  getExecutiveOverview(date: string): Promise<ExecutiveOverviewResponse>;
}

export function createDashboardApi(client: ApiClient): DashboardApi {
  return {
    getTeamOverview(date: string, memberIds: string[]): Promise<TeamOverviewResponse> {
      const params = new URLSearchParams();
      params.set('date', date);
      for (const id of memberIds) {
        params.append('memberIds', id);
      }
      return client.get<TeamOverviewResponse>(`/api/dashboard/team?${params.toString()}`);
    },
    getOrgOverview(date: string): Promise<OrgOverviewResponse> {
      const params = new URLSearchParams();
      params.set('date', date);
      return client.get<OrgOverviewResponse>(`/api/dashboard/leadership?${params.toString()}`);
    },
    getExecutiveOverview(date: string): Promise<ExecutiveOverviewResponse> {
      const params = new URLSearchParams();
      params.set('date', date);
      return client.get<ExecutiveOverviewResponse>(`/api/dashboard/executive?${params.toString()}`);
    },
  };
}
