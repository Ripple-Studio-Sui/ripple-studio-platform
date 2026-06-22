import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { walrus } from '@mysten/walrus';
import type { WalrusUploadOptions, WalrusUploadResult } from './types';

interface PublisherResponse {
  newlyCreated?: {
    blobObject: {
      blobId: string;
      size: number;
    };
    cost?: number;
  };
  alreadyCertified?: {
    blobId: string;
  };
}

function parseSignerKey(privateKey: string): Ed25519Keypair {
  const trimmed = privateKey.trim();
  if (trimmed.startsWith('suiprivkey')) {
    const { secretKey } = decodeSuiPrivateKey(trimmed);
    return Ed25519Keypair.fromSecretKey(secretKey);
  }
  const hex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
  return Ed25519Keypair.fromSecretKey(Uint8Array.from(Buffer.from(hex, 'hex')));
}

export async function uploadViaPublisher(
  publisherUrl: string,
  data: Uint8Array,
  options: WalrusUploadOptions = {},
): Promise<WalrusUploadResult> {
  const url = new URL(`${publisherUrl.replace(/\/$/, '')}/v1/blobs`);
  if (options.epochs) url.searchParams.set('epochs', String(options.epochs));
  if (options.deletable) url.searchParams.set('deletable', 'true');

  const response = await fetch(url.toString(), {
    method: 'PUT',
    body: data,
    headers: options.contentType ? { 'Content-Type': options.contentType } : {},
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Walrus publisher upload failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const json = (await response.json()) as PublisherResponse;

  if (json.newlyCreated?.blobObject) {
    const { blobId, size } = json.newlyCreated.blobObject;
    return {
      blobId,
      sizeBytes: size,
      costWal: json.newlyCreated.cost,
      alreadyExisted: false,
    };
  }

  if (json.alreadyCertified?.blobId) {
    return {
      blobId: json.alreadyCertified.blobId,
      sizeBytes: data.byteLength,
      alreadyExisted: true,
    };
  }

  throw new Error('Walrus publisher returned an unexpected response');
}

export async function uploadViaSdk(
  config: {
    rpcUrl: string;
    network: 'testnet' | 'mainnet';
    uploadRelayUrl?: string;
    signerPrivateKey: string;
  },
  data: Uint8Array,
  options: WalrusUploadOptions = {},
): Promise<WalrusUploadResult> {
  const signer = parseSignerKey(config.signerPrivateKey);
  const epochs = options.epochs ?? 1;

  const client = new SuiGrpcClient({
    network: config.network,
    baseUrl: config.rpcUrl,
  }).$extend(
    walrus(
      config.uploadRelayUrl
        ? {
            uploadRelay: {
              host: config.uploadRelayUrl,
              sendTip: { max: 5_000 },
            },
          }
        : {},
    ),
  );

  const { blobId } = await client.walrus.writeBlob({
    blob: data,
    deletable: options.deletable ?? true,
    epochs,
    signer,
  });

  return {
    blobId,
    sizeBytes: data.byteLength,
    alreadyExisted: false,
  };
}