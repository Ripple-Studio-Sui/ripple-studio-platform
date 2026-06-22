import type { PostgresMemoryStore } from '@ripple-studio/memory';
import { PrismaService } from '../prisma/prisma.service';

export class PrismaMemoryStore implements PostgresMemoryStore {
  constructor(private readonly prisma: PrismaService) {}

  async createEntry(data: {
    userId: string;
    spaceType: string;
    content: string;
    metadata?: Record<string, unknown>;
    source: string;
    memwalBlobId?: string;
    expiresAt: Date | null;
  }) {
    const entry = await this.prisma.memoryEntry.create({
      data: {
        userId: data.userId,
        spaceType: data.spaceType,
        content: data.content,
        metadata: data.metadata ?? undefined,
        source: data.source,
        memwalBlobId: data.memwalBlobId,
        expiresAt: data.expiresAt,
      },
    });
    return { id: entry.id };
  }

  async findEntries(userId: string, spaceTypes?: string[], limit = 50) {
    return this.prisma.memoryEntry.findMany({
      where: {
        userId,
        ...(spaceTypes?.length ? { spaceType: { in: spaceTypes } } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        spaceType: true,
        content: true,
        source: true,
        memwalBlobId: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async purgeExpired(userId: string) {
    const result = await this.prisma.memoryEntry.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}