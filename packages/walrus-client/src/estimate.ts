export const WALRUS_COST_PER_GB_MONTH_USD = 0.023;

const EPOCH_DAYS: Record<'testnet' | 'mainnet', number> = {
  testnet: 1,
  mainnet: 14,
};

export interface StorageCostEstimate {
  totalBytes: number;
  itemCount: number;
  epochs: number;
  estimatedCostUsd: number;
  costPerGbMonthUsd: number;
  storageDays: number;
}

export function estimateStorageCost(
  totalBytes: number,
  itemCount: number,
  epochs: number,
  network: 'testnet' | 'mainnet' = 'testnet',
): StorageCostEstimate {
  const gb = totalBytes / 1024 ** 3;
  const storageDays = epochs * EPOCH_DAYS[network];
  const months = storageDays / 30;
  const estimatedCostUsd = gb * WALRUS_COST_PER_GB_MONTH_USD * months;

  return {
    totalBytes,
    itemCount,
    epochs,
    estimatedCostUsd: Math.round(estimatedCostUsd * 1_000_000) / 1_000_000,
    costPerGbMonthUsd: WALRUS_COST_PER_GB_MONTH_USD,
    storageDays,
  };
}