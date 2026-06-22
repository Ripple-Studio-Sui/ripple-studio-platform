import type { Collection as PrismaCollection } from '@prisma/client';
import type { Collection } from '@ripple-studio/shared';

export function toCollectionDto(record: PrismaCollection): Collection {
  return {
    id: record.id,
    userId: record.userId,
    name: record.name,
    slug: record.slug,
    description: record.description ?? undefined,
    supply: record.supply,
    status: record.status,
    royaltyBps: record.royaltyBps,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}