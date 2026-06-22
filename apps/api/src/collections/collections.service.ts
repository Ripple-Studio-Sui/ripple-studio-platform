import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Collection,
  CollectionDetail,
  CreateCollectionInput,
  UpdateAssetRarityInput,
  UpdateCollectionInput,
  UpdateLayersInput,
} from '@ripple-studio/shared';
import { PrismaService } from '../prisma/prisma.service';
import { slugify, toCollectionDetailDto, toCollectionDto } from './collections.mapper';

@Injectable()
export class CollectionsService {
  private readonly apiUrl = process.env.API_URL ?? 'http://localhost:4000';

  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string): Promise<Collection[]> {
    const records = await this.prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toCollectionDto);
  }

  async findOneForUser(id: string, userId: string): Promise<Collection> {
    const record = await this.assertCollectionAccess(id, userId);
    return toCollectionDto(record);
  }

  async findDetailForUser(id: string, userId: string): Promise<CollectionDetail> {
    const record = await this.prisma.collection.findFirst({
      where: { id, userId },
      include: {
        traitLayers: {
          include: { assets: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Collection ${id} not found`);
    }

    return toCollectionDetailDto(record, this.apiUrl);
  }

  async create(input: CreateCollectionInput, userId: string): Promise<Collection> {
    const record = await this.prisma.collection.create({
      data: {
        userId,
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

  async update(id: string, userId: string, input: UpdateCollectionInput): Promise<Collection> {
    await this.assertCollectionAccess(id, userId);

    const record = await this.prisma.collection.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.name ? slugify(input.name) : undefined,
        description: input.description,
        supply: input.supply,
        royaltyBps: input.royaltyBps,
      },
    });

    return toCollectionDto(record);
  }

  async updateLayers(
    id: string,
    userId: string,
    input: UpdateLayersInput,
  ): Promise<CollectionDetail> {
    await this.assertCollectionAccess(id, userId);

    await this.prisma.$transaction(
      input.layers.map((layer) =>
        this.prisma.traitLayer.update({
          where: { id: layer.id },
          data: {
            name: layer.name,
            displayOrder: layer.displayOrder,
            isRequired: layer.isRequired,
          },
        }),
      ),
    );

    return this.findDetailForUser(id, userId);
  }

  async updateAssetRarity(
    id: string,
    userId: string,
    input: UpdateAssetRarityInput,
  ): Promise<CollectionDetail> {
    await this.assertCollectionAccess(id, userId);

    await this.prisma.$transaction(
      input.assets.map((asset) =>
        this.prisma.traitAsset.update({
          where: { id: asset.id },
          data: { rarityWeight: asset.rarityWeight },
        }),
      ),
    );

    return this.findDetailForUser(id, userId);
  }

  private async assertCollectionAccess(id: string, userId: string) {
    const record = await this.prisma.collection.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    if (record.userId !== userId) {
      throw new ForbiddenException('You do not have access to this collection');
    }
    return record;
  }
}