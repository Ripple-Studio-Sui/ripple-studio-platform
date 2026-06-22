import { Injectable, OnModuleInit } from '@nestjs/common';
import { MemoryClient } from '@ripple-studio/memory';
import type { MemorySpaceSummary, MemoryStatus } from '@ripple-studio/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaMemoryStore } from './prisma-memory-store';

@Injectable()
export class MemoryService implements OnModuleInit {
  private readonly client: MemoryClient;

  constructor(private readonly prisma: PrismaService) {
    this.client = new MemoryClient(new PrismaMemoryStore(prisma));
  }

  async onModuleInit() {
    await this.client.initialize();
  }

  getStatus(): MemoryStatus {
    return this.client.getStatus();
  }

  async listSpaces(userId: string): Promise<MemorySpaceSummary[]> {
    const spaces = await this.prisma.memorySpace.findMany({
      where: { userId },
      orderBy: { spaceType: 'asc' },
    });

    const counts = await this.prisma.memoryEntry.groupBy({
      by: ['spaceType'],
      where: { userId },
      _count: { id: true },
    });

    const countMap = new Map(counts.map((c) => [c.spaceType, c._count.id]));

    return spaces.map((s) => ({
      spaceType: s.spaceType,
      memwalSpaceId: s.memwalSpaceId ?? undefined,
      entryCount: countMap.get(s.spaceType) ?? 0,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async syncUserMemory(userId: string): Promise<{ synced: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        collections: {
          orderBy: { updatedAt: 'desc' },
          take: 20,
          include: {
            traitLayers: { select: { name: true, _count: { select: { assets: true } } } },
            _count: { select: { nftItems: true } },
          },
        },
      },
    });

    if (!user) return { synced: 0 };

    let synced = 0;

    await this.client.remember(
      userId,
      `Creator profile: display name "${user.displayName ?? 'Anonymous'}", experience mode ${user.experienceMode}, tier ${user.tier}, Sui address ${user.suiAddress}.`,
      { spaceType: 'profile', metadata: { type: 'profile_sync' } },
    );
    synced++;

    await this.client.remember(
      userId,
      `Preferences: default royalty ${user.tier === 'free' ? '5%' : 'configurable'}, experience mode ${user.experienceMode}.`,
      { spaceType: 'preferences', metadata: { type: 'preferences_sync' } },
    );
    synced++;

    for (const collection of user.collections) {
      const layers = collection.traitLayers
        .map((l) => `${l.name} (${l._count.assets} traits)`)
        .join(', ');

      await this.client.remember(
        userId,
        `Collection "${collection.name}" (${collection.status}): supply ${collection.supply}, ${collection._count.nftItems} NFTs generated. Layers: ${layers || 'none'}. ${collection.description ?? ''}`.trim(),
        {
          spaceType: 'collections',
          metadata: { collectionId: collection.id, type: 'collection_sync' },
        },
      );
      synced++;
    }

    return { synced };
  }

  async getCoachContext(userId: string, query: string): Promise<string> {
    return this.client.getCoachContext(userId, query);
  }

  async rememberConversation(
    userId: string,
    userMessage: string,
    assistantMessage: string,
    collectionId?: string,
  ): Promise<void> {
    const summary = `User asked: "${userMessage.slice(0, 200)}". Coach replied: "${assistantMessage.slice(0, 300)}".`;
    await this.client.remember(userId, summary, {
      spaceType: 'conversations',
      metadata: { collectionId, type: 'chat_turn' },
    });
  }

  getClient(): MemoryClient {
    return this.client;
  }
}