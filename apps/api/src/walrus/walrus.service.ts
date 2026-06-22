import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createWalrusClient } from '@ripple-studio/walrus-client';
import type { WalrusCostEstimate, WalrusUploadJobStatus } from '@ripple-studio/shared';
import { stat } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../generation/queue.service';

@Injectable()
export class WalrusService {
  private readonly uploadsDir = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');
  private readonly walrus = createWalrusClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async startUpload(collectionId: string, userId: string): Promise<WalrusUploadJobStatus> {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
      include: { nftItems: true },
    });

    if (!collection) throw new NotFoundException('Collection not found');

    if (collection.status !== 'generated') {
      throw new BadRequestException('Collection must be generated before Walrus upload');
    }

    const pending = collection.nftItems.filter((i) => i.status === 'generated' && !i.imageBlobId);
    if (!pending.length) {
      const uploaded = collection.nftItems.filter((i) => i.imageBlobId).length;
      if (uploaded > 0) {
        return {
          jobId: '',
          status: 'completed',
          progress: uploaded,
          total: collection.nftItems.length,
          uploaded,
          failed: 0,
        };
      }
      throw new BadRequestException('No generated NFTs to upload');
    }

    const activeJob = await this.prisma.job.findFirst({
      where: {
        type: 'walrus-upload',
        status: { in: ['queued', 'processing'] },
        payload: { path: ['collectionId'], equals: collectionId },
      },
    });

    if (activeJob) return this.toJobStatus(activeJob);

    const job = await this.prisma.job.create({
      data: {
        type: 'walrus-upload',
        status: 'queued',
        payload: {
          collectionId,
          progress: 0,
          total: collection.nftItems.length,
          uploaded: 0,
          failed: 0,
        },
      },
    });

    await this.queue.enqueueWalrusUpload(collectionId, job.id);

    return this.toJobStatus(job);
  }

  async getStatus(collectionId: string, userId: string): Promise<WalrusUploadJobStatus> {
    await this.assertAccess(collectionId, userId);

    const job = await this.prisma.job.findFirst({
      where: { type: 'walrus-upload', payload: { path: ['collectionId'], equals: collectionId } },
      orderBy: { createdAt: 'desc' },
    });

    if (!job) {
      const uploaded = await this.prisma.nftItem.count({
        where: { collectionId, imageBlobId: { not: null } },
      });
      if (uploaded > 0) {
        const total = await this.prisma.nftItem.count({ where: { collectionId } });
        return {
          jobId: '',
          status: 'completed',
          progress: uploaded,
          total,
          uploaded,
          failed: 0,
        };
      }
      throw new NotFoundException('No Walrus upload job found');
    }

    return this.toJobStatus(job);
  }

  async estimateCost(collectionId: string, userId: string): Promise<WalrusCostEstimate> {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
      include: {
        nftItems: {
          where: { status: 'generated', imageBlobId: null },
          orderBy: { tokenId: 'asc' },
        },
      },
    });

    if (!collection) throw new NotFoundException('Collection not found');

    let totalBytes = 0;
    for (const item of collection.nftItems) {
      try {
        const filePath = this.resolveImagePath(collectionId, item.tokenId, item.imageUrl);
        const fileStat = await stat(filePath);
        totalBytes += fileStat.size;
      } catch {
        totalBytes += 500_000;
      }
    }

    const estimate = this.walrus.estimateCost(totalBytes, collection.nftItems.length);

    return {
      totalBytes: estimate.totalBytes,
      nftCount: estimate.itemCount,
      epochs: estimate.epochs,
      estimatedCostUsd: estimate.estimatedCostUsd,
      costPerGbMonthUsd: estimate.costPerGbMonthUsd,
      storageDays: estimate.storageDays,
    };
  }

  private resolveImagePath(collectionId: string, tokenId: number, imageUrl: string | null): string {
    if (imageUrl) {
      const marker = '/uploads/';
      const idx = imageUrl.indexOf(marker);
      if (idx >= 0) {
        return join(this.uploadsDir, imageUrl.slice(idx + marker.length));
      }
    }
    return join(this.uploadsDir, collectionId, 'generated', `${tokenId}.png`);
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
  }): WalrusUploadJobStatus {
    const payload = (job.payload ?? {}) as Record<string, number | string>;
    return {
      jobId: job.id,
      status: job.status as WalrusUploadJobStatus['status'],
      progress: Number(payload.progress ?? payload.uploaded ?? 0),
      total: Number(payload.total ?? 0),
      uploaded: Number(payload.uploaded ?? payload.progress ?? 0),
      failed: Number(payload.failed ?? 0),
      totalBytes: payload.totalBytes ? Number(payload.totalBytes) : undefined,
      estimatedCostWal: payload.estimatedCostWal ? Number(payload.estimatedCostWal) : undefined,
      error: job.error ?? undefined,
    };
  }
}