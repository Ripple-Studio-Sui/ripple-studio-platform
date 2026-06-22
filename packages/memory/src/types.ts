export const MEMORY_SPACE_TYPES = [
  'profile',
  'collections',
  'conversations',
  'preferences',
  'reasoning',
] as const;

export type MemorySpaceType = (typeof MEMORY_SPACE_TYPES)[number];

export const MEMORY_RETENTION_DAYS: Partial<Record<MemorySpaceType, number>> = {
  conversations: 90,
  reasoning: 30,
};

export interface MemoryRecallResult {
  content: string;
  spaceType: MemorySpaceType;
  score: number;
  source: 'postgres' | 'memwal';
  memwalBlobId?: string;
}

export interface RememberOptions {
  metadata?: Record<string, unknown>;
  spaceType: MemorySpaceType;
}

export interface MemoryProviderConfig {
  memwalEnabled?: boolean;
  memwalKey?: string;
  memwalAccountId?: string;
  memwalRelayerUrl?: string;
}

export interface MemoryProviderStatus {
  primary: 'postgres' | 'memwal' | 'hybrid';
  memwalConfigured: boolean;
  memwalHealthy: boolean;
}