import type { COLLECTION_STATUSES } from '../constants';

export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

export interface TraitLayer {
  id: string;
  name: string;
  displayOrder: number;
  isRequired: boolean;
}

export interface TraitAsset {
  id: string;
  layerId: string;
  name: string;
  rarityWeight: number;
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

export interface CreateCollectionInput {
  name: string;
  description?: string;
  supply: number;
  royaltyBps?: number;
}