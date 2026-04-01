import { ApiClient } from './client';
import {
  RcdoTreeRallyCry,
  OutcomeSearchResult,
  RallyCry,
  DefiningObjective,
  Outcome,
  CreateRallyCryRequest,
  UpdateRallyCryRequest,
  CreateDefiningObjectiveRequest,
  UpdateDefiningObjectiveRequest,
  CreateOutcomeRequest,
  UpdateOutcomeRequest,
} from './types';

export interface RcdoApi {
  getTree(includeArchived?: boolean): Promise<RcdoTreeRallyCry[]>;
  searchOutcomes(query: string): Promise<OutcomeSearchResult[]>;
  createRallyCry(req: CreateRallyCryRequest): Promise<RallyCry>;
  updateRallyCry(id: string, req: UpdateRallyCryRequest): Promise<RallyCry>;
  archiveRallyCry(id: string): Promise<RallyCry>;
  unarchiveRallyCry(id: string): Promise<RallyCry>;
  createDefiningObjective(req: CreateDefiningObjectiveRequest): Promise<DefiningObjective>;
  updateDefiningObjective(id: string, req: UpdateDefiningObjectiveRequest): Promise<DefiningObjective>;
  archiveDefiningObjective(id: string): Promise<DefiningObjective>;
  unarchiveDefiningObjective(id: string): Promise<DefiningObjective>;
  createOutcome(req: CreateOutcomeRequest): Promise<Outcome>;
  updateOutcome(id: string, req: UpdateOutcomeRequest): Promise<Outcome>;
  archiveOutcome(id: string): Promise<Outcome>;
  unarchiveOutcome(id: string): Promise<Outcome>;
}

export function createRcdoApi(client: ApiClient): RcdoApi {
  return {
    getTree(includeArchived?: boolean): Promise<RcdoTreeRallyCry[]> {
      const path = includeArchived
        ? '/api/rcdo/tree?includeArchived=true'
        : '/api/rcdo/tree';
      return client.get<RcdoTreeRallyCry[]>(path);
    },
    searchOutcomes(query: string): Promise<OutcomeSearchResult[]> {
      const encoded = encodeURIComponent(query);
      return client.get<OutcomeSearchResult[]>(`/api/rcdo/outcomes/search?q=${encoded}`);
    },
    createRallyCry(req: CreateRallyCryRequest): Promise<RallyCry> {
      return client.post<RallyCry>('/api/rcdo/rally-cries', req);
    },
    updateRallyCry(id: string, req: UpdateRallyCryRequest): Promise<RallyCry> {
      return client.put<RallyCry>(`/api/rcdo/rally-cries/${id}`, req);
    },
    archiveRallyCry(id: string): Promise<RallyCry> {
      return client.patch<RallyCry>(`/api/rcdo/rally-cries/${id}/archive`);
    },
    unarchiveRallyCry(id: string): Promise<RallyCry> {
      return client.patch<RallyCry>(`/api/rcdo/rally-cries/${id}/unarchive`);
    },
    createDefiningObjective(req: CreateDefiningObjectiveRequest): Promise<DefiningObjective> {
      return client.post<DefiningObjective>('/api/rcdo/defining-objectives', req);
    },
    updateDefiningObjective(id: string, req: UpdateDefiningObjectiveRequest): Promise<DefiningObjective> {
      return client.put<DefiningObjective>(`/api/rcdo/defining-objectives/${id}`, req);
    },
    archiveDefiningObjective(id: string): Promise<DefiningObjective> {
      return client.patch<DefiningObjective>(`/api/rcdo/defining-objectives/${id}/archive`);
    },
    unarchiveDefiningObjective(id: string): Promise<DefiningObjective> {
      return client.patch<DefiningObjective>(`/api/rcdo/defining-objectives/${id}/unarchive`);
    },
    createOutcome(req: CreateOutcomeRequest): Promise<Outcome> {
      return client.post<Outcome>('/api/rcdo/outcomes', req);
    },
    updateOutcome(id: string, req: UpdateOutcomeRequest): Promise<Outcome> {
      return client.put<Outcome>(`/api/rcdo/outcomes/${id}`, req);
    },
    archiveOutcome(id: string): Promise<Outcome> {
      return client.patch<Outcome>(`/api/rcdo/outcomes/${id}/archive`);
    },
    unarchiveOutcome(id: string): Promise<Outcome> {
      return client.patch<Outcome>(`/api/rcdo/outcomes/${id}/unarchive`);
    },
  };
}
