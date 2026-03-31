import { ApiClient } from './client';
import { RcdoTreeRallyCry, OutcomeSearchResult } from './types';

export interface RcdoApi {
  getTree(): Promise<RcdoTreeRallyCry[]>;
  searchOutcomes(query: string): Promise<OutcomeSearchResult[]>;
}

export function createRcdoApi(client: ApiClient): RcdoApi {
  return {
    getTree(): Promise<RcdoTreeRallyCry[]> {
      return client.get<RcdoTreeRallyCry[]>('/api/rcdo/tree');
    },
    searchOutcomes(query: string): Promise<OutcomeSearchResult[]> {
      const encoded = encodeURIComponent(query);
      return client.get<OutcomeSearchResult[]>(`/api/rcdo/outcomes/search?q=${encoded}`);
    },
  };
}
