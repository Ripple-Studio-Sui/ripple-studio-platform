import type { COLLECTION_STATUSES } from '../constants';

export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

export interface TraitLayer {
  id: string;
  name: string;
  displayOrder: number;
  isRequired: boolean;
  blendMode?: string;
}

export interface TraitAsset {
  id: string;
  layerId: string;
  name: string;
  rarityWeight: number;
  filePath?: string;
  previewUrl?: string;
}

export interface TraitLayerWithAssets extends TraitLayer {
  assets: TraitAsset[];
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  supply: number;
  status: CollectionStatus;
  royaltyBps: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionDetail extends Collection {
  traitLayers: TraitLayerWithAssets[];
  possibleCombinations: number;
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
  supply: number;
  royaltyBps?: number;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string;
  supply?: number;
  royaltyBps?: number;
}

export interface UpdateLayerInput {
  id: string;
  name?: string;
  displayOrder: number;
  isRequired?: boolean;
}

export interface UpdateLayersInput {
  layers: UpdateLayerInput[];
}

export interface UpdateAssetRarityInput {
  assets: Array<{ id: string; rarityWeight: number }>;
}

export interface PreviewCombination {
  id: string;
  traits: Array<{ layerId: string; layerName: string; assetId: string; assetName: string; previewUrl: string }>;
  rarityScore?: number;
}

export interface UploadTraitsResult {
  layersCreated: number;
  assetsCreated: number;
  collection: CollectionDetail;
}