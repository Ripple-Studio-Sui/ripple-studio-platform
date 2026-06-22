import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { countPossibleCombinations, type GenerationLayer } from '@ripple-studio/generation';
import type { GenerationJobStatus, NftItemPreview } from '@ripple-studio/shared';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from './queue.service';

interface StoredTrait {
  trait_type: string;
  value: string;
  assetId?: string;
}

@Injectable()
export class GenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async startGeneration(collectionId: string, userId: string): Promise<GenerationJobStatus> {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
      include: {
        traitLayers: { include: { assets: true }, orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!collection) throw new NotFoundException('Collection not found');

    if (collection.status === 'generating') {
      throw new BadRequestException('Generation already in progress');
    }

    const layers: GenerationLayer[] = collection.traitLayers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      displayOrder: layer.displayOrder,
      isRequired: layer.isRequired,
      assets: layer.assets.map((a) => ({
        id: a.id,
        layerId: layer.id,
        layerName: layer.name,
        name: a.name,
        filePath: a.filePath,
        rarityWeight: a.rarityWeight,
      })),
    }));

    if (!layers.some((l) => l.isRequired && l.assets.length > 0)) {
      throw new BadRequestException('Upload traits before generating');
    }

    const possible = countPossibleCombinations(layers);
    if (possible < collection.supply) {
      throw new BadRequestException(
        `Not enough unique combinations (${possible}) for supply of ${collection.supply}`,
      );
    }

    const activeJob = await this.prisma.job.findFirst({
      where: {
        type: 'nft-generation',
        status: { in: ['queued', 'processing'] },
        payload: { path: ['collectionId'], equals: collectionId },
      },
    });

    if (activeJob) {
      return this.toJobStatus(activeJob);
    }

    const job = await this.prisma.job.create({
      data: {
        type: 'nft-generation',
        status: 'queued',
        payload: { collectionId, progress: 0, total: collection.supply, duplicatesSkipped: 0 },
      },
    });

    await this.queue.enqueueGeneration(collectionId, job.id);

    return this.toJobStatus(job);
  }

  async getStatus(collectionId: string, userId: string): Promise<GenerationJobStatus> {
    await this.assertAccess(collectionId, userId);

    const job = await this.prisma.job.findFirst({
      where: { type: 'nft-generation', payload: { path: ['collectionId'], equals: collectionId } },
      orderBy: { createdAt: 'desc' },
    });

    if (!job) {
      const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
      if (collection?.status === 'generated') {
        const count = await this.prisma.nftItem.count({ where: { collectionId } });
        return {
          jobId: '',
          status: 'completed',
          progress: count,
          total: count,
          generated: count,
          duplicatesSkipped: 0,
        };
      }
      throw new NotFoundException('No generation job found');
    }

    return this.toJobStatus(job);
  }

  async listNftItems(
    collectionId: string,
    userId: string,
    page = 1,
    limit = 50,
  ): Promise<{ items: NftItemPreview[]; total: number }> {
    await this.assertAccess(collectionId, userId);

    const [items, total] = await Promise.all([
      this.prisma.nftItem.findMany({
        where: { collectionId },
        orderBy: { tokenId: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.nftItem.count({ where: { collectionId } }),
    ]);

    return {
      total,
      items: items.map((item) => ({
        id: item.id,
        tokenId: item.tokenId,
        name: item.name ?? `#${item.tokenId}`,
        imageUrl: item.imageUrl ?? '',
        rarityScore: Number(item.rarityScore ?? 0),
        rarityRank: item.rarityRank ?? 0,
        traits: this.parseTraits(item.traits),
      })),
    };
  }

  private parseTraits(raw: unknown): Array<{ trait_type: string; value: string }> {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((t): t is StoredTrait => typeof t === 'object' && t !== null && 'trait_type' in t)
      .map((t) => ({ trait_type: t.trait_type, value: t.value }));
  }

  private async assertAccess(collectionId: string, userId: string) {
    const collection = await this.prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.userId !== userId) throw new ForbiddenException('Access denied');
  }

  private toJobStatus(job: {
    id: string;
    status: string;
    payload: unknown;
    error: string | null;
  }): GenerationJobStatus {
    const payload = (job.payload ?? {}) as Record<string, number>;
    return {
      jobId: job.id,
      status: job.status as GenerationJobStatus['status'],
      progress: payload.progress ?? 0,
      total: payload.total ?? 0,
      generated: payload.generated ?? payload.progress ?? 0,
      duplicatesSkipped: payload.duplicatesSkipped ?? 0,
      error: job.error ?? undefined,
    };
  }
}