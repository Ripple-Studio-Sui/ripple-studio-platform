import { MemWalMemoryProvider } from './memwal-provider';
import { scoreText } from './search';
import { computeExpiresAt } from './retention';
import type {
  MemoryProviderConfig,
  MemoryProviderStatus,
  MemoryRecallResult,
  MemorySpaceType,
  RememberOptions,
} from './types';
import { MEMORY_SPACE_TYPES } from './types';

export interface PostgresMemoryStore {
  createEntry(data: {
    userId: string;
    spaceType: string;
    content: string;
    metadata?: Record<string, unknown>;
    source: string;
    memwalBlobId?: string;
    expiresAt: Date | null;
  }): Promise<{ id: string }>;

  findEntries(userId: string, spaceTypes?: string[], limit?: number): Promise<
    Array<{
      id: string;
      spaceType: string;
      content: string;
      source: string;
      memwalBlobId: string | null;
      createdAt: Date;
      expiresAt: Date | null;
    }>
  >;

  purgeExpired(userId: string): Promise<number>;
}

export class MemoryClient {
  private readonly memwal: MemWalMemoryProvider;
  private initialized = false;

  constructor(
    private readonly store: PostgresMemoryStore,
    config?: MemoryProviderConfig,
  ) {
    this.memwal = new MemWalMemoryProvider({
      memwalEnabled: config?.memwalEnabled ?? process.env.MEMWAL_ENABLED === 'true',
      memwalKey: config?.memwalKey ?? process.env.MEMWAL_DELEGATE_KEY,
      memwalAccountId: config?.memwalAccountId ?? process.env.MEMWAL_ACCOUNT_ID,
      memwalRelayerUrl:
        config?.memwalRelayerUrl ??
        process.env.MEMWAL_RELAYER_URL ??
        'https://relayer-staging.memory.walrus.xyz',
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.memwal.initialize();
    this.initialized = true;
  }

  getStatus(): MemoryProviderStatus {
    const memwalConfigured = this.memwal.isConfigured;
    const memwalHealthy = this.memwal.isHealthy();
    let primary: MemoryProviderStatus['primary'] = 'postgres';
    if (memwalConfigured && memwalHealthy) primary = 'hybrid';
    else if (memwalConfigured) primary = 'postgres';

    return { primary, memwalConfigured, memwalHealthy };
  }

  async remember(userId: string, content: string, options: RememberOptions): Promise<string> {
    await this.initialize();
    await this.store.purgeExpired(userId);

    const expiresAt = computeExpiresAt(options.spaceType);
    const memwalJobId = await this.memwal.remember(userId, options.spaceType, content);

    const entry = await this.store.createEntry({
      userId,
      spaceType: options.spaceType,
      content,
      metadata: options.metadata,
      source: memwalJobId ? 'hybrid' : 'postgres',
      memwalBlobId: memwalJobId ?? undefined,
      expiresAt,
    });

    return entry.id;
  }

  async recall(
    userId: string,
    query: string,
    spaceTypes: MemorySpaceType[] = [...MEMORY_SPACE_TYPES],
    limit = 8,
  ): Promise<MemoryRecallResult[]> {
    await this.initialize();
    await this.store.purgeExpired(userId);

    const results: MemoryRecallResult[] = [];

    if (this.memwal.isHealthy()) {
      for (const spaceType of spaceTypes) {
        const memwalResults = await this.memwal.recall(userId, spaceType, query, 3);
        results.push(...memwalResults);
      }
    }

    const pgEntries = await this.store.findEntries(userId, spaceTypes, 50);
    const now = new Date();

    for (const entry of pgEntries) {
      if (entry.expiresAt && entry.expiresAt < now) continue;
      const score = scoreText(query, entry.content);
      if (score <= 0) continue;
      results.push({
        content: entry.content,
        spaceType: entry.spaceType as MemorySpaceType,
        score,
        source: entry.source === 'hybrid' ? 'postgres' : (entry.source as 'postgres'),
        memwalBlobId: entry.memwalBlobId ?? undefined,
      });
    }

    const seen = new Set<string>();
    return results
      .sort((a, b) => b.score - a.score)
      .filter((r) => {
        const key = `${r.spaceType}:${r.content.slice(0, 80)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);
  }

  formatContext(results: MemoryRecallResult[]): string {
    if (!results.length) return '';
    return results
      .map((r) => `[${r.spaceType}] ${r.content}`)
      .join('\n');
  }

  async getCoachContext(userId: string, query: string): Promise<string> {
    const recallSpaces: MemorySpaceType[] = ['profile', 'collections', 'preferences', 'conversations'];
    const results = await this.recall(userId, query, recallSpaces, 6);
    return this.formatContext(results);
  }
}