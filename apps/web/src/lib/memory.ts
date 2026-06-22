import type { MemorySpaceSummary, MemoryStatus } from '@ripple-studio/shared';
import { apiFetch } from './api';

export async function getMemoryStatus(): Promise<MemoryStatus> {
  return apiFetch<MemoryStatus>('/memory/status');
}

export async function listMemorySpaces(): Promise<MemorySpaceSummary[]> {
  return apiFetch<MemorySpaceSummary[]>('/memory/spaces');
}

export async function syncMemory(): Promise<{ synced: number }> {
  return apiFetch<{ synced: number }>('/memory/sync', { method: 'POST' });
}