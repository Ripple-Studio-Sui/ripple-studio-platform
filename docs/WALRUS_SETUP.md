# Walrus Storage Setup

PR-6 adds decentralized image storage via [Walrus](https://docs.wal.app/).

## Testnet (default)

No wallet required. The platform uses Mysten Labs' public testnet publisher:

| Variable | Default |
|----------|---------|
| `WALRUS_PUBLISHER_URL` | `https://publisher.walrus-testnet.walrus.space` |
| `WALRUS_AGGREGATOR_URL` | `https://aggregator.walrus-testnet.walrus.space` |
| `WALRUS_STORAGE_EPOCHS` | `26` (~26 days on testnet) |

Copy `.env.example` to `.env` and start the worker:

```bash
npm run dev
```

## Mainnet

Mainnet has no public unauthenticated publisher. Configure:

1. `WALRUS_SIGNER_PRIVATE_KEY` — platform treasury keypair (needs SUI for gas + WAL for storage)
2. `WALRUS_UPLOAD_RELAY_URL` — `https://upload-relay.mainnet.walrus.space`
3. `WALRUS_AGGREGATOR_URL` — `https://aggregator.walrus-mainnet.walrus.space`
4. Clear `WALRUS_PUBLISHER_URL` (SDK + relay path is used instead)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/collections/:id/walrus/upload` | Queue batch image upload |
| `GET` | `/collections/:id/walrus/status` | Upload job progress |
| `GET` | `/collections/:id/walrus/estimate` | Pre-upload cost estimate |

## Flow

1. Generate NFTs (PR-5) — images saved locally under `uploads/{collectionId}/generated/`
2. Click **Store on Walrus** in the create wizard or collection view
3. Worker uploads images in batches, records `walrus_blobs`, updates `nft_items.image_blob_id` and `image_url`
4. Images served at `{AGGREGATOR}/v1/blobs/{blob_id}`

Metadata JSON upload is handled in PR-7.