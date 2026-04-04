import { ApiClient } from './client';
import {
  Commitment,
  CreateCommitmentRequest,
  UpdateCommitmentRequest,
  ReconcileCommitmentRequest,
  ReconcileItemRequest,
} from './types';

export interface CommitmentsApi {
  listCommitments(planId: string): Promise<Commitment[]>;
  createCommitment(planId: string, req: CreateCommitmentRequest): Promise<Commitment>;
  updateCommitment(planId: string, commitmentId: string, req: UpdateCommitmentRequest): Promise<Commitment>;
  deleteCommitment(planId: string, commitmentId: string): Promise<void>;
  reorderCommitments(planId: string, orderedIds: string[]): Promise<Commitment[]>;
  reconcileCommitment(planId: string, commitmentId: string, req: ReconcileCommitmentRequest): Promise<Commitment>;
  bulkReconcile(planId: string, items: ReconcileItemRequest[]): Promise<Commitment[]>;
}

export function createCommitmentsApi(client: ApiClient): CommitmentsApi {
  return {
    listCommitments(planId: string): Promise<Commitment[]> {
      return client.get<Commitment[]>(`/api/plans/${planId}/commitments`);
    },
    createCommitment(planId: string, req: CreateCommitmentRequest): Promise<Commitment> {
      return client.post<Commitment>(`/api/plans/${planId}/commitments`, req);
    },
    updateCommitment(planId: string, commitmentId: string, req: UpdateCommitmentRequest): Promise<Commitment> {
      return client.put<Commitment>(`/api/plans/${planId}/commitments/${commitmentId}`, req);
    },
    deleteCommitment(planId: string, commitmentId: string): Promise<void> {
      return client.delete(`/api/plans/${planId}/commitments/${commitmentId}`);
    },
    reorderCommitments(planId: string, orderedIds: string[]): Promise<Commitment[]> {
      return client.put<Commitment[]>(`/api/plans/${planId}/commitments/reorder`, { orderedCommitmentIds: orderedIds });
    },
    reconcileCommitment(planId: string, commitmentId: string, req: ReconcileCommitmentRequest): Promise<Commitment> {
      return client.patch<Commitment>(`/api/plans/${planId}/commitments/${commitmentId}/reconcile`, req);
    },
    bulkReconcile(planId: string, items: ReconcileItemRequest[]): Promise<Commitment[]> {
      return client.patch<Commitment[]>(`/api/plans/${planId}/commitments/reconcile`, { items });
    },
  };
}
