import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Collection, CreateCollectionInput } from '@ripple-studio/shared';
import { PrismaService } from '../prisma/prisma.service';
import { slugify, toCollectionDto } from './collections.mapper';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string): Promise<Collection[]> {
    const records = await this.prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toCollectionDto);
  }

  async findOneForUser(id: string, userId: string): Promise<Collection> {
    const record = await this.prisma.collection.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    if (record.userId !== userId) {
      throw new ForbiddenException('You do not have access to this collection');
    }
    return toCollectionDto(record);
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
}