import { Injectable, NotFoundException } from '@nestjs/common';
import type { Collection, CreateCollectionInput } from '@ripple-studio/shared';
import { PrismaService } from '../prisma/prisma.service';
import { slugify, toCollectionDto } from './collections.mapper';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Collection[]> {
    const records = await this.prisma.collection.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toCollectionDto);
  }

  async findOne(id: string): Promise<Collection> {
    const record = await this.prisma.collection.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    return toCollectionDto(record);
  }

  async create(input: CreateCollectionInput, userId?: string): Promise<Collection> {
    const ownerId = userId ?? (await this.ensureDemoUser()).id;

    const record = await this.prisma.collection.create({
      data: {
        userId: ownerId,
        name: input.name,
        slug: slugify(input.name),
        description: input.description,
        supply: input.supply,
        royaltyBps: input.royaltyBps ?? 500,
        status: 'draft',
      },
    });

    return toCollectionDto(record);
  }

  /** Demo user for development before zkLogin (PR-3) */
  private async ensureDemoUser() {
    const existing = await this.prisma.user.findFirst({
      where: { zkloginSub: 'demo-user' },
    });

    if (existing) return existing;

    const saltVault = await this.prisma.saltVault.create({
      data: { encryptedSalt: 'demo-encrypted-salt-placeholder' },
    });

    return this.prisma.user.create({
      data: {
        zkloginIss: 'https://demo.ripple.studio',
        zkloginSub: 'demo-user',
        zkloginAud: 'ripple-studio-demo',
        suiAddress: '0x' + '0'.repeat(64),
        saltRefId: saltVault.id,
        displayName: 'Demo Creator',
        wallets: {
          create: {
            suiAddress: '0x' + '0'.repeat(64),
            isPrimary: true,
          },
        },
        memorySpaces: {
          create: [
            { spaceType: 'profile' },
            { spaceType: 'collections' },
            { spaceType: 'conversations' },
            { spaceType: 'preferences' },
          ],
        },
      },
    });
  }
}