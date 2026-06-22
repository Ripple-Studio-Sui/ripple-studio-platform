import type { WalrusCostEstimate, WalrusUploadJobStatus } from '@ripple-studio/shared';
import { apiFetch } from './api';

export async function startWalrusUpload(collectionId: string): Promise<WalrusUploadJobStatus> {
  return apiFetch<WalrusUploadJobStatus>(`/collections/${collectionId}/walrus/upload`, {
    method: 'POST',
  });
}

export async function getWalrusUploadStatus(collectionId: string): Promise<WalrusUploadJobStatus> {
  return apiFetch<WalrusUploadJobStatus>(`/collections/${collectionId}/walrus/status`);
}

export async function getWalrusCostEstimate(collectionId: string): Promise<WalrusCostEstimate> {
  return apiFetch<WalrusCostEstimate>(`/collections/${collectionId}/walrus/estimate`);
}