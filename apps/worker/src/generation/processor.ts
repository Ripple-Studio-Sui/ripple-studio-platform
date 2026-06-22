import {
  assignRarityRanks,
  computeRarityScores,
  countTraitFrequencies,
  generateUniqueCombos,
  type GenerationLayer,
} from '@ripple-studio/generation';
import { PrismaClient } from '@prisma/client';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

export interface GenerationJobData {
  collectionId: string;
  jobId: string;
}

export class GenerationProcessor {
  private readonly uploadsDir = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');
  private readonly apiUrl = process.env.API_URL ?? 'http://localhost:4000';

  constructor(private readonly prisma: PrismaClient) {}

  async process(data: GenerationJobData) {
    const { collectionId, jobId } = data;

    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'processing', attempts: { increment: 1 } },
    });

    await this.prisma.collection.update({
      where: { id: collectionId },
      data: { status: 'generating' },
    });

    try {
      const collection = await this.prisma.collection.findUnique({
        where: { id: collectionId },
        include: {
          traitLayers: {
            include: { assets: true },
            orderBy: { displayOrder: 'asc' },
          },
          nftItems: { select: { id: true } },
        },
      });

      if (!collection) throw new Error('Collection not found');

      if (collection.nftItems.length > 0) {
        await this.prisma.nftItem.deleteMany({ where: { collectionId } });
      }

      const layers: GenerationLayer[] = collection.traitLayers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        displayOrder: layer.displayOrder,
        isRequired: layer.isRequired,
        assets: layer.assets.map((asset) => ({
          id: asset.id,
          layerId: layer.id,
          layerName: layer.name,
          name: asset.name,
          filePath: asset.filePath,
          rarityWeight: asset.rarityWeight,
        })),
      }));

      const { combos, duplicatesSkipped } = generateUniqueCombos(layers, collection.supply);

      const assetMeta = new Map(
        layers.flatMap((l) => l.assets.map((a) => [a.id, { layerName: l.name, assetName: a.name }])),
      );

      const outputDir = join(this.uploadsDir, collectionId, 'generated');
      await mkdir(outputDir, { recursive: true });

      const comboRecords = combos.map((combo, index) => ({
        combo,
        traitHash: combo.traitHash,
        assetIds: combo.assets.map((a) => a.id),
        tokenId: index + 1,
        assetPaths: combo.assets.map((a) => join(this.uploadsDir, a.filePath)),
      }));

      let processed = 0;
      const progressUpdateInterval = Math.max(1, Math.floor(comboRecords.length / 20));

      for (const combo of comboRecords) {
        const outputFilename = `${combo.tokenId}.png`;
        const outputPath = join(outputDir, outputFilename);
        const relativePath = `${collectionId}/generated/${outputFilename}`;

        await this.compositeImages(combo.assetPaths, outputPath);

        const traits = combo.combo.assets.map((a) => ({
          trait_type: a.layerName,
          value: a.name,
          assetId: a.id,
        }));

        await this.prisma.nftItem.create({
          data: {
            collectionId,
            tokenId: combo.tokenId,
            name: `${collection.name} #${combo.tokenId}`,
            traitHash: combo.traitHash,
            traits,
            imageUrl: `${this.apiUrl}/uploads/${relativePath}`,
            status: 'generated',
          },
        });

        processed++;
        if (processed % progressUpdateInterval === 0) {
          await this.prisma.job.update({
            where: { id: jobId },
            data: {
              payload: {
                collectionId,
                progress: processed,
                total: comboRecords.length,
                duplicatesSkipped,
              },
            },
          });
        }
      }

      const rarityInput = comboRecords.map((c) => ({
        traitHash: c.traitHash,
        assetIds: c.assetIds,
      }));

      const frequencies = countTraitFrequencies(rarityInput, assetMeta);
      const scores = computeRarityScores(rarityInput, frequencies);
      const ranks = assignRarityRanks(scores);

      for (const combo of comboRecords) {
        const score = scores.get(combo.traitHash) ?? 0;
        const rank = ranks.get(combo.traitHash) ?? 0;
        await this.prisma.nftItem.updateMany({
          where: { collectionId, traitHash: combo.traitHash },
          data: { rarityScore: score, rarityRank: rank },
        });
      }

      await this.prisma.collection.update({
        where: { id: collectionId },
        data: { status: 'generated' },
      });

      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          payload: {
            collectionId,
            progress: comboRecords.length,
            total: comboRecords.length,
            duplicatesSkipped,
            generated: comboRecords.length,
          },
        },
      });

      return {
        generated: comboRecords.length,
        duplicatesSkipped,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';

      await this.prisma.collection.update({
        where: { id: collectionId },
        data: { status: 'draft' },
      });

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'failed', error: message, completedAt: new Date() },
      });

      throw error;
    }
  }

  private async compositeImages(assetPaths: string[], outputPath: string) {
    const rasterPaths = assetPaths.filter((p) => /\.(png|jpe?g|webp)$/i.test(p));

    if (!rasterPaths.length) {
      throw new Error('No raster images available for compositing');
    }

    const metadata = await sharp(rasterPaths[0]).metadata();
    const width = metadata.width ?? 1024;
    const height = metadata.height ?? 1024;

    const compositeInputs = await Promise.all(
      rasterPaths.map(async (path) => {
        const buffer = await sharp(path).resize(width, height, { fit: 'contain' }).png().toBuffer();
        return { input: buffer, top: 0, left: 0 };
      }),
    );

    await sharp({
      create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite(compositeInputs)
      .png()
      .toFile(outputPath);
  }
}