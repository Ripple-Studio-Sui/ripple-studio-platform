import type { GenerationJobStatus, NftListResponse } from '@ripple-studio/shared';
import { apiFetch } from './api';

export async function startGeneration(collectionId: string): Promise<GenerationJobStatus> {
  return apiFetch<GenerationJobStatus>(`/collections/${collectionId}/generate`, {
    method: 'POST',
  });
}

export async function getGenerationStatus(collectionId: string): Promise<GenerationJobStatus> {
  return apiFetch<GenerationJobStatus>(`/collections/${collectionId}/generation/status`);
}

export async function listGeneratedNfts(
  collectionId: string,
  page = 1,
  limit = 50,
): Promise<NftListResponse> {
  return apiFetch<NftListResponse>(
    `/collections/${collectionId}/nfts?page=${page}&limit=${limit}`,
  );
}