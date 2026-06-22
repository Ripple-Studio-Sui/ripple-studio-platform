export interface WalrusUploadJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total: number;
  uploaded: number;
  failed: number;
  totalBytes?: number;
  estimatedCostWal?: number;
  error?: string;
}

export interface WalrusCostEstimate {
  totalBytes: number;
  nftCount: number;
  epochs: number;
  estimatedCostUsd: number;
  costPerGbMonthUsd: number;
  storageDays: number;
}