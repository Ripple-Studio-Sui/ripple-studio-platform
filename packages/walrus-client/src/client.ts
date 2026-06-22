import { readFile } from 'fs/promises';
import { uploadViaPublisher, uploadViaSdk } from './upload';
import { estimateStorageCost } from './estimate';
import { blobUrl, resolveNetworkDefaults } from './urls';
import type { WalrusClientConfig, WalrusUploadOptions, WalrusUploadResult } from './types';

export class WalrusClient {
  private readonly network: 'testnet' | 'mainnet';
  private readonly publisherUrl: string;
  readonly aggregatorUrl: string;
  private readonly uploadRelayUrl?: string;
  private readonly rpcUrl: string;
  private readonly signerPrivateKey?: string;
  readonly storageEpochs: number;

  constructor(config: WalrusClientConfig = {}) {
    this.network = config.network ?? (process.env.SUI_NETWORK as 'testnet' | 'mainnet') ?? 'testnet';
    const defaults = resolveNetworkDefaults(this.network);

    this.publisherUrl =
      config.publisherUrl ?? process.env.WALRUS_PUBLISHER_URL ?? defaults.publisher;
    this.aggregatorUrl =
      config.aggregatorUrl ?? process.env.WALRUS_AGGREGATOR_URL ?? defaults.aggregator;
    this.uploadRelayUrl =
      config.uploadRelayUrl ?? process.env.WALRUS_UPLOAD_RELAY_URL ?? defaults.uploadRelay;
    this.rpcUrl = config.rpcUrl ?? process.env.SUI_RPC_URL ?? defaults.rpc;
    this.signerPrivateKey = config.signerPrivateKey ?? process.env.WALRUS_SIGNER_PRIVATE_KEY;
    this.storageEpochs = config.storageEpochs ?? parseInt(process.env.WALRUS_STORAGE_EPOCHS ?? '26', 10);
  }

  getBlobUrl(blobId: string): string {
    return blobUrl(this.aggregatorUrl, blobId);
  }

  async upload(data: Uint8Array, options?: WalrusUploadOptions): Promise<WalrusUploadResult> {
    const opts: WalrusUploadOptions = {
      epochs: options?.epochs ?? this.storageEpochs,
      deletable: options?.deletable ?? true,
      contentType: options?.contentType,
    };

    if (this.signerPrivateKey) {
      return uploadViaSdk(
        {
          rpcUrl: this.rpcUrl,
          network: this.network,
          uploadRelayUrl: this.uploadRelayUrl,
          signerPrivateKey: this.signerPrivateKey,
        },
        data,
        opts,
      );
    }

    if (!this.publisherUrl) {
      throw new Error(
        'Walrus upload requires WALRUS_PUBLISHER_URL (testnet) or WALRUS_SIGNER_PRIVATE_KEY (mainnet/SDK)',
      );
    }

    return uploadViaPublisher(this.publisherUrl, data, opts);
  }

  async uploadFile(filePath: string, contentType = 'image/png'): Promise<WalrusUploadResult> {
    const data = await readFile(filePath);
    return this.upload(new Uint8Array(data), { contentType });
  }

  estimateCost(totalBytes: number, itemCount: number, epochs?: number) {
    return estimateStorageCost(totalBytes, itemCount, epochs ?? this.storageEpochs, this.network);
  }
}

export function createWalrusClient(config?: WalrusClientConfig): WalrusClient {
  return new WalrusClient(config);
}