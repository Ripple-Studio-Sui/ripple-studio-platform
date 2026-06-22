import { memwalNamespace } from './retention';
import type { MemoryProviderConfig, MemoryRecallResult, MemorySpaceType } from './types';

interface MemWalClient {
  health(): Promise<{ status: string }>;
  remember(text: string, namespace?: string): Promise<{ job_id: string }>;
  recall(params: { query: string; limit?: number; namespace?: string }): Promise<{
    results: Array<{ text: string; blob_id: string; distance: number }>;
  }>;
}

export class MemWalMemoryProvider {
  private client: MemWalClient | null = null;
  private healthy = false;

  constructor(private readonly config: MemoryProviderConfig) {}

  get isConfigured(): boolean {
    return !!(
      this.config.memwalEnabled &&
      this.config.memwalKey &&
      this.config.memwalAccountId &&
      this.config.memwalRelayerUrl
    );
  }

  async initialize(): Promise<boolean> {
    if (!this.isConfigured) return false;

    try {
      const mod = await import('@mysten-incubation/memwal');
      const MemWal = mod.MemWal as {
        create: (cfg: {
          key: string;
          accountId: string;
          serverUrl: string;
        }) => MemWalClient;
      };

      this.client = MemWal.create({
        key: this.config.memwalKey!,
        accountId: this.config.memwalAccountId!,
        serverUrl: this.config.memwalRelayerUrl!,
      });

      const health = await this.client.health();
      this.healthy = health.status === 'ok' || health.status === 'healthy';
      return this.healthy;
    } catch (error) {
      console.warn('[memory] MemWal init failed, using PostgreSQL fallback:', error);
      this.client = null;
      this.healthy = false;
      return false;
    }
  }

  isHealthy(): boolean {
    return this.healthy && this.client !== null;
  }

  async remember(userId: string, spaceType: MemorySpaceType, content: string): Promise<string | null> {
    if (!this.client) return null;

    try {
      const namespace = memwalNamespace(userId, spaceType);
      const job = await this.client.remember(content, namespace);
      return job.job_id;
    } catch (error) {
      console.warn(`[memory] MemWal remember failed (${spaceType}):`, error);
      return null;
    }
  }

  async recall(
    userId: string,
    spaceType: MemorySpaceType,
    query: string,
    limit = 5,
  ): Promise<MemoryRecallResult[]> {
    if (!this.client) return [];

    try {
      const namespace = memwalNamespace(userId, spaceType);
      const result = await this.client.recall({ query, limit, namespace });

      return result.results.map((r) => ({
        content: r.text,
        spaceType,
        score: Math.max(0, 1 - r.distance),
        source: 'memwal' as const,
        memwalBlobId: r.blob_id,
      }));
    } catch (error) {
      console.warn(`[memory] MemWal recall failed (${spaceType}):`, error);
      return [];
    }
  }
}