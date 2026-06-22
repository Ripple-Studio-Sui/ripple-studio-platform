import type { User as PrismaUser } from '@prisma/client';
import type { User } from '@ripple-studio/shared';

export function toUserDto(record: PrismaUser): User {
  return {
    id: record.id,
    email: record.email ?? undefined,
    displayName: record.displayName ?? undefined,
    avatarUrl: record.avatarUrl ?? undefined,
    suiAddress: record.suiAddress,
    experienceMode: record.experienceMode,
    tier: record.tier,
    createdAt: record.createdAt.toISOString(),
  };
}