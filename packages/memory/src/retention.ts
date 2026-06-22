import type { MemorySpaceType } from './types';
import { MEMORY_RETENTION_DAYS } from './types';

export function computeExpiresAt(spaceType: MemorySpaceType): Date | null {
  const days = MEMORY_RETENTION_DAYS[spaceType];
  if (!days) return null;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}

export function memwalNamespace(userId: string, spaceType: MemorySpaceType): string {
  return `ripple-${userId.slice(0, 8)}-${spaceType}`;
}