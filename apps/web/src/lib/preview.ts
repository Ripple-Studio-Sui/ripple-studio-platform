import {
  MAX_PREVIEW_COMBOS,
  PREVIEW_SAMPLE_COUNT,
  type PreviewCombination,
  type TraitLayerWithAssets,
} from '@ripple-studio/shared';

export function countCombinations(layers: TraitLayerWithAssets[]): number {
  return layers.reduce((product, layer) => {
    if (!layer.isRequired || layer.assets.length === 0) return product;
    return product * layer.assets.length;
  }, 1);
}

export function generatePreviewCombinations(
  layers: TraitLayerWithAssets[],
  sampleCount = PREVIEW_SAMPLE_COUNT,
): PreviewCombination[] {
  const requiredLayers = layers.filter((l) => l.isRequired && l.assets.length > 0);
  if (!requiredLayers.length) return [];

  const total = countCombinations(requiredLayers);
  const seen = new Set<string>();
  const results: PreviewCombination[] = [];
  const maxAttempts = sampleCount * 20;
  let attempts = 0;

  while (results.length < Math.min(sampleCount, total, MAX_PREVIEW_COMBOS) && attempts < maxAttempts) {
    attempts++;
    const traits = requiredLayers.map((layer) => {
      const asset = layer.assets[Math.floor(Math.random() * layer.assets.length)];
      return {
        layerId: layer.id,
        layerName: layer.name,
        assetId: asset.id,
        assetName: asset.name,
        previewUrl: asset.previewUrl ?? '',
      };
    });

    const hash = traits.map((t) => t.assetId).sort().join('|');
    if (seen.has(hash)) continue;
    seen.add(hash);

    const rarityScore = traits.reduce((sum, trait) => {
      const layer = requiredLayers.find((l) => l.id === trait.layerId);
      const asset = layer?.assets.find((a) => a.id === trait.assetId);
      return sum + (asset?.rarityWeight ?? 100);
    }, 0);

    results.push({
      id: hash,
      traits,
      rarityScore,
    });
  }

  return results;
}