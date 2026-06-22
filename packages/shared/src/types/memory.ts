export interface MemorySpaceSummary {
  spaceType: string;
  memwalSpaceId?: string;
  entryCount: number;
  createdAt: string;
}

export interface MemoryStatus {
  primary: 'postgres' | 'memwal' | 'hybrid';
  memwalConfigured: boolean;
  memwalHealthy: boolean;
}