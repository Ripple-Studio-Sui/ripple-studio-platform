import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import type { MetadataJobStatus, MetadataSummary } from '@ripple-studio/shared';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../generation/queue.service';

@Injectable()
export class MetadataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async startGeneration(collectionId: string, userId: string): Promise<MetadataJobStatus> {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
      include: { nftItems: true },
    });

    if (!collection) throw new NotFoundException('Collection not found');

    if (!collection.nftItems.length) {
      throw new BadRequestException('Generate NFTs before creating metadata');
    }

    const missingWalrus = collection.nftItems.filter((i) => !i.imageBlobId);
    if (missingWalrus.length) {
      throw new BadRequestException(
        `${missingWalrus.length} NFT(s) are not on Walrus — upload images first`,
      );
    }

    const activeJob = await this.prisma.job.findFirst({
      where: {
        type: 'metadata-generation',
        status: { in: ['queued', 'processing'] },
        payload: { path: ['collectionId'], equals: collectionId },
      },
    });

    if (activeJob) return this.toJobStatus(activeJob);

    const job = await this.prisma.job.create({
      data: {
        type: 'metadata-generation',
        status: 'queued',
        payload: {
          collectionId,
          phase: 'generating',
          progress: 0,
          total: collection.nftItems.length,
          generated: 0,
          uploaded: 0,
          failed: 0,
        },
      },
    });

    await this.queue.enqueueMetadataGeneration(collectionId, job.id);

    return this.toJobStatus(job);
  }

  async getStatus(collectionId: string, userId: string): Promise<MetadataJobStatus> {
    await this.assertAccess(collectionId, userId);

    const job = await this.prisma.job.findFirst({
      where: {
        type: 'metadata-generation',
        payload: { path: ['collectionId'], equals: collectionId },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!job) {
      const summary = await this.getSummary(collectionId);
      if (summary.generated > 0) {
        return {
          jobId: '',
          status: summary.uploaded === summary.total ? 'completed' : 'completed',
          phase: summary.readyForExport ? 'done' : 'uploading',
          progress: summary.uploaded || summary.generated,
          total: summary.total,
          generated: summary.generated,
          uploaded: summary.uploaded,
          failed: 0,
        };
      }
      throw new NotFoundException('No metadata job found');
    }

    return this.toJobStatus(job);
  }

  async getSummary(collectionId: string, userId?: string): Promise<MetadataSummary> {
    if (userId) await this.assertAccess(collectionId, userId);
    const [total, generated, uploaded] = await Promise.all([
      this.prisma.nftItem.count({ where: { collectionId } }),
      this.prisma.metadataRecord.count({ where: { nftItem: { collectionId } } }),
      this.prisma.metadataRecord.count({
        where: { nftItem: { collectionId }, walrusBlobId: { not: null } },
      }),
    ]);

    return {
      total,
      generated,
      uploaded,
      readyForExport: generated > 0,
    };
  }

  async exportZip(collectionId: string, userId: string): Promise<StreamableFile> {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });

    if (!collection) throw new NotFoundException('Collection not found');

    const records = await this.prisma.metadataRecord.findMany({
      where: { nftItem: { collectionId } },
      include: { nftItem: { select: { tokenId: true } } },
      orderBy: { nftItem: { tokenId: 'asc' } },
    });

    if (!records.length) {
      throw new BadRequestException('No metadata generated yet — run metadata generation first');
    }

    const stream = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => stream.destroy(err));
    archive.pipe(stream);

    for (const record of records) {
      const filename = `${record.nftItem.tokenId}.json`;
      const content = JSON.stringify(record.payload, null, 2);
      archive.append(content, { name: filename });
    }

    const manifest = {
      collection: collection.name,
      slug: collection.slug,
      supply: collection.supply,
      count: records.length,
      exportedAt: new Date().toISOString(),
      schemaVersion: '1.0',
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: '_manifest.json' });

    void archive.finalize();

    const safeName = collection.slug.replace(/[^a-z0-9-]/gi, '-');
    return new StreamableFile(stream, {
      type: 'application/zip',
      disposition: `attachment; filename="${safeName}-metadata.zip"`,
    });
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
  }): MetadataJobStatus {
    const payload = (job.payload ?? {}) as Record<string, string | number>;
    return {
      jobId: job.id,
      status: job.status as MetadataJobStatus['status'],
      phase: (payload.phase as MetadataJobStatus['phase']) ?? 'generating',
      progress: Number(payload.progress ?? payload.uploaded ?? payload.generated ?? 0),
      total: Number(payload.total ?? 0),
      generated: Number(payload.generated ?? 0),
      uploaded: Number(payload.uploaded ?? 0),
      failed: Number(payload.failed ?? 0),
      error: job.error ?? undefined,
    };
  }
}