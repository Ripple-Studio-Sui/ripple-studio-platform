import { createWalrusClient } from '@ripple-studio/walrus-client';
import { PrismaClient } from '@prisma/client';
import { join } from 'path';

export interface WalrusUploadJobData {
  collectionId: string;
  jobId: string;
}

const DEFAULT_BATCH_SIZE = 10;

export class WalrusUploadProcessor {
  private readonly uploadsDir = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');
  private readonly batchSize = parseInt(process.env.WALRUS_UPLOAD_BATCH_SIZE ?? String(DEFAULT_BATCH_SIZE), 10);
  private readonly walrus = createWalrusClient();

  constructor(private readonly prisma: PrismaClient) {}

  async process(data: WalrusUploadJobData) {
    const { collectionId, jobId } = data;

    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'processing', attempts: { increment: 1 } },
    });

    try {
      const collection = await this.prisma.collection.findUnique({
        where: { id: collectionId },
        include: {
          nftItems: {
            where: { status: { in: ['generated', 'uploaded'] } },
            orderBy: { tokenId: 'asc' },
          },
        },
      });

      if (!collection) throw new Error('Collection not found');

      const pending = collection.nftItems.filter((item) => !item.imageBlobId);
      const total = collection.nftItems.length;

      if (!pending.length) {
        await this.completeJob(jobId, collectionId, total, 0, 0);
        return { uploaded: 0, failed: 0, total };
      }

      let uploaded = collection.nftItems.filter((i) => i.imageBlobId).length;
      let failed = 0;
      let totalBytes = BigInt(0);
      let totalCostWal = 0;

      for (let i = 0; i < pending.length; i += this.batchSize) {
        const batch = pending.slice(i, i + this.batchSize);

        await Promise.all(
          batch.map(async (item) => {
            try {
              const filePath = this.resolveImagePath(collectionId, item.tokenId, item.imageUrl);
              const result = await this.walrus.uploadFile(filePath, 'image/png');

              await this.prisma.walrusBlob.upsert({
                where: { blobId: result.blobId },
                create: {
                  blobId: result.blobId,
                  contentType: 'image/png',
                  sizeBytes: BigInt(result.sizeBytes),
                  costWal: result.costWal ?? null,
                },
                update: {
                  sizeBytes: BigInt(result.sizeBytes),
                  costWal: result.costWal ?? null,
                },
              });

              await this.prisma.nftItem.update({
                where: { id: item.id },
                data: {
                  imageBlobId: result.blobId,
                  imageUrl: this.walrus.getBlobUrl(result.blobId),
                  status: 'uploaded',
                },
              });

              uploaded++;
              totalBytes += BigInt(result.sizeBytes);
              if (result.costWal) totalCostWal += result.costWal;
            } catch (error) {
              failed++;
              console.error(`[walrus] Failed to upload NFT #${item.tokenId}:`, error);
            }
          }),
        );

        await this.prisma.job.update({
          where: { id: jobId },
          data: {
            payload: {
              collectionId,
              progress: uploaded,
              total,
              uploaded,
              failed,
              totalBytes: totalBytes.toString(),
              estimatedCostWal: totalCostWal,
            },
          },
        });
      }

      await this.completeJob(jobId, collectionId, total, uploaded, failed, totalBytes, totalCostWal);

      return { uploaded, failed, total };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Walrus upload failed';

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'failed', error: message, completedAt: new Date() },
      });

      throw error;
    }
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

  private async completeJob(
    jobId: string,
    collectionId: string,
    total: number,
    uploaded: number,
    failed: number,
    totalBytes?: bigint,
    totalCostWal?: number,
  ) {
    const allUploaded = uploaded === total && failed === 0;

    if (allUploaded) {
      await this.prisma.collection.update({
        where: { id: collectionId },
        data: { status: 'generated' },
      });
    }

    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: failed > 0 && uploaded === 0 ? 'failed' : 'completed',
        completedAt: new Date(),
        error: failed > 0 ? `${failed} NFT(s) failed to upload` : null,
        payload: {
          collectionId,
          progress: uploaded,
          total,
          uploaded,
          failed,
          totalBytes: totalBytes?.toString(),
          estimatedCostWal: totalCostWal,
        },
      },
    });
  }
}