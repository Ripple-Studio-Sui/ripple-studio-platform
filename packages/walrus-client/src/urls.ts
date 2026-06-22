const TESTNET_DEFAULTS = {
  publisher: 'https://publisher.walrus-testnet.walrus.space',
  aggregator: 'https://aggregator.walrus-testnet.walrus.space',
  uploadRelay: 'https://upload-relay.testnet.walrus.space',
  rpc: 'https://fullnode.testnet.sui.io:443',
} as const;

const MAINNET_DEFAULTS = {
  publisher: '',
  aggregator: 'https://aggregator.walrus-mainnet.walrus.space',
  uploadRelay: 'https://upload-relay.mainnet.walrus.space',
  rpc: 'https://fullnode.mainnet.sui.io:443',
} as const;

export function resolveNetworkDefaults(network: 'testnet' | 'mainnet' = 'testnet') {
  return network === 'mainnet' ? MAINNET_DEFAULTS : TESTNET_DEFAULTS;
}

export function blobUrl(aggregatorUrl: string, blobId: string): string {
  const base = aggregatorUrl.replace(/\/$/, '');
  return `${base}/v1/blobs/${encodeURIComponent(blobId)}`;
}