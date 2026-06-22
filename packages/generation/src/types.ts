export interface GenerationAsset {
  id: string;
  layerId: string;
  layerName: string;
  name: string;
  filePath: string;
  rarityWeight: number;
}

export interface GenerationLayer {
  id: string;
  name: string;
  displayOrder: number;
  isRequired: boolean;
  assets: GenerationAsset[];
}

export interface GeneratedCombo {
  traitHash: string;
  assets: GenerationAsset[];
  rarityWeightSum: number;
}

export interface TraitFrequency {
  assetId: string;
  layerName: string;
  assetName: string;
  count: number;
  frequency: number;
}