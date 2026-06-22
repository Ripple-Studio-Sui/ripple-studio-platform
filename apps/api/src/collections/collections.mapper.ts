import type {
  Collection as PrismaCollection,
  TraitAsset as PrismaTraitAsset,
  TraitLayer as PrismaTraitLayer,
} from '@prisma/client';
import type { Collection, CollectionDetail, TraitAsset, TraitLayerWithAssets } from '@ripple-studio/shared';

type LayerWithAssets = PrismaTraitLayer & { assets: PrismaTraitAsset[] };

type CollectionWithLayers = PrismaCollection & { traitLayers: LayerWithAssets[] };

export function toCollectionDto(record: PrismaCollection): Collection {
  return {
    id: record.id,
    userId: record.userId,
    name: record.name,
    slug: record.slug,
    description: record.description ?? undefined,
    supply: record.supply,
    status: record.status,
    royaltyBps: record.royaltyBps,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toTraitAssetDto(asset: PrismaTraitAsset, apiUrl: string): TraitAsset {
  return {
    id: asset.id,
    layerId: asset.layerId,
    name: asset.name,
    rarityWeight: asset.rarityWeight,
    filePath: asset.filePath,
    previewUrl: asset.filePath ? `${apiUrl}/uploads/${asset.filePath}` : undefined,
  };
}

export function toLayerDto(layer: LayerWithAssets, apiUrl: string): TraitLayerWithAssets {
  return {
    id: layer.id,
    name: layer.name,
    displayOrder: layer.displayOrder,
    isRequired: layer.isRequired,
    blendMode: layer.blendMode,
    assets: layer.assets.map((a) => toTraitAssetDto(a, apiUrl)),
  };
}

export function toCollectionDetailDto(record: CollectionWithLayers, apiUrl: string): CollectionDetail {
  const layers = record.traitLayers
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((l) => toLayerDto(l, apiUrl));

  const possibleCombinations = layers.reduce((product, layer) => {
    const count = layer.assets.length || 1;
    return layer.isRequired ? product * count : product;
  }, 1);

  return {
    ...toCollectionDto(record),
    traitLayers: layers,
    possibleCombinations,
  };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}