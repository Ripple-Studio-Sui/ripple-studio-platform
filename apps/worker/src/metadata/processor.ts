import { buildSuiMetadata, validateSuiMetadata } from '@ripple-studio/metadata';
import { createWalrusClient } from '@ripple-studio/walrus-client';
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export interface MetadataJobData {
  collectionId: string;
  jobId: string;
}

interface StoredTrait {
  trait_type: string;
  value: string;
}

const DEFAULT_BATCH_SIZE = 50;

export class MetadataProcessor {
  private readonly uploadsDir = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');
  private readonly batchSize = parseInt(
    process.env.METADATA_UPLOAD_BATCH_SIZE ?? String(DEFAULT_BATCH_SIZE),
    10,
  );
  private readonly walrus = createWalrusClient();

  constructor(private readonly prisma: PrismaClient) {}

  async process(data: MetadataJobData) {
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
            orderBy: { tokenId: 'asc' },
            include: { metadataRecord: true },
          },
        },
      });

      if (!collection) throw new Error('Collection not found');
      if (!collection.nftItems.length) throw new Error('No NFTs to generate metadata for');

      const withoutWalrus = collection.nftItems.filter((i) => !i.imageBlobId);
      if (withoutWalrus.length) {
        throw new Error(
          `${withoutWalrus.length} NFT(s) missing Walrus image upload — store images on Walrus first`,
        );
      }

      const total = collection.nftItems.length;
      const metadataDir = join(this.uploadsDir, collectionId, 'metadata');
      await mkdir(metadataDir, { recursive: true });

      let generated = 0;
      let uploaded = collection.nftItems.filter((i) => i.metadataRecord?.walrusBlobId).length;
      let failed = 0;

      for (const item of collection.nftItems) {
        const traits = this.parseTraits(item.traits);
        const metadata = buildSuiMetadata({
          collectionId,
          collectionName: collection.name,
          collectionDescription: collection.description,
          tokenId: item.tokenId,
          name: item.name,
          imageUrl: item.imageUrl ?? this.walrus.getBlobUrl(item.imageBlobId!),
          imageBlobId: item.imageBlobId,
          traits,
        });

        const validation = validateSuiMetadata(metadata, {
          imageBlobId: item.imageBlobId,
          requireWalrusImage: true,
        });

        if (!validation.valid) {
          throw new Error(`Metadata validation failed for #${item.tokenId}: ${validation.errors.join('; ')}`);
        }

        await this.prisma.metadataRecord.upsert({
          where: { nftItemId: item.id },
          create: {
            nftItemId: item.id,
            payload: metadata,
            schemaVersion: '1.0',
          },
          update: {
            payload: metadata,
            schemaVersion: '1.0',
          },
        });

        await writeFile(
          join(metadataDir, `${item.tokenId}.json`),
          JSON.stringify(metadata, null, 2),
          'utf-8',
        );

        generated++;

        if (generated % this.batchSize === 0 || generated === total) {
          await this.updateJob(jobId, collectionId, {
            phase: 'generating',
            progress: generated,
            total,
            generated,
            uploaded,
            failed,
          });
        }
      }

      const pendingUpload = await this.prisma.metadataRecord.findMany({
        where: {
          nftItem: { collectionId },
          walrusBlobId: null,
        },
        include: { nftItem: { select: { tokenId: true } } },
        orderBy: { nftItem: { tokenId: 'asc' } },
      });

      for (let i = 0; i < pendingUpload.length; i += this.batchSize) {
        const batch = pendingUpload.slice(i, i + this.batchSize);

        await Promise.all(
          batch.map(async (record) => {
            try {
              const json = JSON.stringify(record.payload);
              const bytes = new TextEncoder().encode(json);
              const result = await this.walrus.upload(bytes, {
                contentType: 'application/json',
              });

              await this.prisma.walrusBlob.upsert({
                where: { blobId: result.blobId },
                create: {
                  blobId: result.blobId,
                  contentType: 'application/json',
                  sizeBytes: BigInt(result.sizeBytes),
                  costWal: result.costWal ?? null,
                },
                update: {
                  sizeBytes: BigInt(result.sizeBytes),
                  costWal: result.costWal ?? null,
                },
              });

              const metadataUri = this.walrus.getBlobUrl(result.blobId);

              await this.prisma.metadataRecord.update({
                where: { id: record.id },
                data: {
                  walrusBlobId: result.blobId,
                  metadataUri,
                },
              });

              uploaded++;
            } catch (error) {
              failed++;
              console.error(
                `[metadata] Failed to upload metadata #${record.nftItem.tokenId}:`,
                error,
              );
            }
          }),
        );

        await this.updateJob(jobId, collectionId, {
          phase: 'uploading',
          progress: uploaded,
          total,
          generated,
          uploaded,
          failed,
        });
      }

      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: failed > 0 && uploaded === 0 ? 'failed' : 'completed',
          completedAt: new Date(),
          error: failed > 0 ? `${failed} metadata file(s) failed to upload` : null,
          payload: {
            collectionId,
            phase: 'done',
            progress: uploaded,
            total,
            generated,
            uploaded,
            failed,
          },
        },
      });

      return { generated, uploaded, failed, total };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Metadata generation failed';

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'failed', error: message, completedAt: new Date() },
      });

      throw error;
    }
  }

  private parseTraits(raw: unknown): StoredTrait[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((t): t is StoredTrait => typeof t === 'object' && t !== null && 'trait_type' in t)
      .map((t) => ({ trait_type: t.trait_type, value: t.value }));
  }

  private async updateJob(
    jobId: string,
    collectionId: string,
    data: {
      phase: string;
      progress: number;
      total: number;
      generated: number;
      uploaded: number;
      failed: number;
    },
  ) {
    await this.prisma.job.update({
      where: { id: jobId },
      data: { payload: { collectionId, ...data } },
    });
  }
}