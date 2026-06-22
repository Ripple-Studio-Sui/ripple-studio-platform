export interface WalrusUploadOptions {
  epochs?: number;
  deletable?: boolean;
  contentType?: string;
}

export interface WalrusUploadResult {
  blobId: string;
  sizeBytes: number;
  costWal?: number;
  alreadyExisted: boolean;
}

export interface WalrusClientConfig {
  network?: 'testnet' | 'mainnet';
  rpcUrl?: string;
  publisherUrl?: string;
  aggregatorUrl?: string;
  uploadRelayUrl?: string;
  signerPrivateKey?: string;
  storageEpochs?: number;
}