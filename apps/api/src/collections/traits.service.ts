import { BadRequestException, Injectable } from '@nestjs/common';
import { SUPPORTED_IMAGE_FORMATS } from '@ripple-studio/shared';
import { mkdir, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from './collections.mapper';

interface ParsedTraitFile {
  layerName: string;
  traitName: string;
  relativePath: string;
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class TraitsService {
  private readonly uploadsDir = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {}

  async uploadTraits(
    collectionId: string,
    userId: string,
    files: Express.Multer.File[],
    paths: string[],
  ) {
    const collection = await this.prisma.collection.findFirst({
      where: { id: collectionId, userId },
    });
    if (!collection) {
      throw new BadRequestException('Collection not found');
    }

    if (!files.length) {
      throw new BadRequestException('No files provided');
    }

    const parsed = this.parseFiles(files, paths);
    const layerOrder = [...new Set(parsed.map((p) => p.layerName))];

    let assetsCreated = 0;

    for (let i = 0; i < layerOrder.length; i++) {
      const layerName = layerOrder[i];
      const layerFiles = parsed.filter((p) => p.layerName === layerName);

      let layer = await this.prisma.traitLayer.findFirst({
        where: { collectionId, name: layerName },
      });

      if (!layer) {
        layer = await this.prisma.traitLayer.create({
          data: {
            collectionId,
            name: layerName,
            displayOrder: i,
            isRequired: true,
          },
        });
      }

      for (const file of layerFiles) {
        const destDir = join(this.uploadsDir, collectionId, slugify(layerName));
        await mkdir(destDir, { recursive: true });

        const filename = `${slugify(file.traitName)}${extname(file.relativePath) || '.png'}`;
        const destPath = join(destDir, filename);
        await writeFile(destPath, file.buffer);

        const filePath = `${collectionId}/${slugify(layerName)}/${filename}`;

        const existing = await this.prisma.traitAsset.findFirst({
          where: { layerId: layer.id, name: file.traitName },
        });

        if (existing) {
          await this.prisma.traitAsset.update({
            where: { id: existing.id },
            data: { filePath },
          });
        } else {
          await this.prisma.traitAsset.create({
            data: {
              layerId: layer.id,
              name: file.traitName,
              filePath,
              rarityWeight: 100,
            },
          });
          assetsCreated++;
        }
      }
    }

    return {
      layersCreated: layerOrder.length,
      assetsCreated,
    };
  }

  private parseFiles(files: Express.Multer.File[], paths: string[]): ParsedTraitFile[] {
    const parsed: ParsedTraitFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = paths[i] ?? file.originalname;
      const segments = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);

      if (segments.length < 2) {
        throw new BadRequestException(
          `Invalid path "${relativePath}". Use folder structure: LayerName/trait.png`,
        );
      }

      const ext = extname(segments[segments.length - 1]).slice(1).toLowerCase();
      if (!SUPPORTED_IMAGE_FORMATS.includes(ext as (typeof SUPPORTED_IMAGE_FORMATS)[number])) {
        continue;
      }

      const layerName = segments[segments.length - 2];
      const traitName = basename(segments[segments.length - 1], extname(segments[segments.length - 1]));

      parsed.push({
        layerName: this.formatName(layerName),
        traitName: this.formatName(traitName),
        relativePath,
        buffer: file.buffer,
        mimetype: file.mimetype,
      });
    }

    if (!parsed.length) {
      throw new BadRequestException('No supported image files found (PNG, JPG, SVG, GIF)');
    }

    return parsed;
  }

  private formatName(raw: string): string {
    return raw.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}