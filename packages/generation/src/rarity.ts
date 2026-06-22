import type { TraitFrequency } from './types';

export interface ComboForRarity {
  traitHash: string;
  assetIds: string[];
}

export function countTraitFrequencies(
  combos: ComboForRarity[],
  assetMeta: Map<string, { layerName: string; assetName: string }>,
): Map<string, TraitFrequency> {
  const counts = new Map<string, number>();

  for (const combo of combos) {
    for (const assetId of combo.assetIds) {
      counts.set(assetId, (counts.get(assetId) ?? 0) + 1);
    }
  }

  const supply = combos.length;
  const frequencies = new Map<string, TraitFrequency>();

  for (const [assetId, count] of counts) {
    const meta = assetMeta.get(assetId);
    frequencies.set(assetId, {
      assetId,
      layerName: meta?.layerName ?? 'Unknown',
      assetName: meta?.assetName ?? 'Unknown',
      count,
      frequency: count / supply,
    });
  }

  return frequencies;
}

export function computeRarityScores(
  combos: ComboForRarity[],
  frequencies: Map<string, TraitFrequency>,
): Map<string, number> {
  const scores = new Map<string, number>();

  for (const combo of combos) {
    let score = 0;
    for (const assetId of combo.assetIds) {
      const freq = frequencies.get(assetId);
      if (freq && freq.frequency > 0) {
        score += 1 / freq.frequency;
      }
    }
    scores.set(combo.traitHash, score);
  }

  return scores;
}

export function assignRarityRanks(scores: Map<string, number>): Map<string, number> {
  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const ranks = new Map<string, number>();
  sorted.forEach(([hash], index) => ranks.set(hash, index + 1));
  return ranks;
}