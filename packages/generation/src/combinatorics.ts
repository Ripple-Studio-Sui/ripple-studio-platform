import { createHash } from 'crypto';
import type { GeneratedCombo, GenerationLayer } from './types';

export function computeTraitHash(assetIds: string[]): string {
  const sorted = [...assetIds].sort();
  return createHash('sha256').update(sorted.join('|')).digest('hex');
}

export function weightedRandomSelect<T extends { rarityWeight: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.rarityWeight, 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= item.rarityWeight;
    if (roll <= 0) return item;
  }

  return items[items.length - 1];
}

export function generateUniqueCombos(
  layers: GenerationLayer[],
  supply: number,
  maxAttemptsMultiplier = 50,
): { combos: GeneratedCombo[]; duplicatesSkipped: number } {
  const requiredLayers = layers
    .filter((l) => l.isRequired && l.assets.length > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (!requiredLayers.length) {
    throw new Error('No layers with assets configured for generation');
  }

  const seen = new Set<string>();
  const combos: GeneratedCombo[] = [];
  let duplicatesSkipped = 0;
  const maxAttempts = supply * maxAttemptsMultiplier;

  for (let attempt = 0; attempt < maxAttempts && combos.length < supply; attempt++) {
    const selected = requiredLayers.map((layer) => weightedRandomSelect(layer.assets));
    const assetIds = selected.map((a) => a.id);
    const traitHash = computeTraitHash(assetIds);

    if (seen.has(traitHash)) {
      duplicatesSkipped++;
      continue;
    }

    seen.add(traitHash);
    combos.push({
      traitHash,
      assets: selected,
      rarityWeightSum: selected.reduce((sum, a) => sum + a.rarityWeight, 0),
    });
  }

  if (combos.length < supply) {
    throw new Error(
      `Could only generate ${combos.length} unique combinations (requested ${supply}). Add more traits or reduce supply.`,
    );
  }

  return { combos, duplicatesSkipped };
}

export function countPossibleCombinations(layers: GenerationLayer[]): number {
  return layers
    .filter((l) => l.isRequired && l.assets.length > 0)
    .reduce((product, layer) => product * layer.assets.length, 1);
}