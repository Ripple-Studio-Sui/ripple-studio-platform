# Metadata Engine Setup

PR-7 generates Sui Display-compatible metadata for each NFT, validates it, uploads JSON to Walrus, and exports a ZIP.

## Schema

Each metadata file follows the Sui NFT display standard:

```json
{
  "name": "Cyber Explorer #42",
  "description": "A unique piece from the Cyber Explorers collection. Traits — Background: Neon City, Helmet: Void Visor.",
  "image_url": "https://aggregator.walrus-testnet.walrus.space/v1/blobs/{image_blob_id}",
  "attributes": [
    { "trait_type": "Background", "value": "Neon City" },
    { "trait_type": "Helmet", "value": "Void Visor" }
  ],
  "project_url": "http://localhost:3000/collections/{collection_id}"
}
```

## Prerequisites

1. NFTs generated (PR-5)
2. Images stored on Walrus (PR-6) — metadata requires Walrus `image_url` values

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/collections/:id/metadata/generate` | Queue metadata generation + Walrus upload |
| `GET` | `/collections/:id/metadata/status` | Job progress |
| `GET` | `/collections/:id/metadata/summary` | Counts (generated / uploaded) |
| `GET` | `/collections/:id/metadata/export` | Download metadata ZIP |

## Flow

1. Worker builds metadata from collection + trait data
2. Validates required fields and Walrus image cross-reference
3. Persists to `metadata_records` table
4. Writes local copies to `uploads/{collectionId}/metadata/{tokenId}.json`
5. Batch-uploads JSON files to Walrus
6. UI offers **Download ZIP** with all `{tokenId}.json` files + `_manifest.json`

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `METADATA_UPLOAD_BATCH_SIZE` | `50` | Concurrent metadata Walrus uploads |

## MVP Exit Criteria

Creator can sign in, build a 500-piece collection, store images on Walrus, and download a metadata ZIP.