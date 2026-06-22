# MemWal Memory Setup

PR-9 adds persistent creator memory with a PostgreSQL fallback and optional MemWal integration.

## Architecture

```
Creator Coach → MemoryClient → PostgreSQL (always)
                            → MemWal relayer (optional, when configured)
```

Memory spaces per creator (created on zkLogin signup):

| Space | Contents | Retention |
|-------|----------|-----------|
| `profile` | Brand voice, experience mode | Permanent |
| `collections` | Past project summaries | Permanent |
| `conversations` | Chat turn summaries | 90 days |
| `preferences` | Royalty defaults, marketplace choices | Permanent |
| `reasoning` | Launch strategy traces (builder mode) | 30 days |

## Default (PostgreSQL only)

Works out of the box — no extra configuration. Memories are stored in `memory_entries` and recalled via keyword search. The Creator Coach automatically:

1. **Recalls** relevant memories before each response
2. **Remembers** conversation summaries after each chat turn

### Sync profile + collections

```bash
POST /memory/sync
```

Or click **Sync memory** in the Creator Coach sidebar.

## MemWal (optional hybrid mode)

Enable decentralized memory on Walrus + Sui:

```env
MEMWAL_ENABLED=true
MEMWAL_DELEGATE_KEY=<ed25519-hex-private-key>
MEMWAL_ACCOUNT_ID=<memwal-account-object-id>
MEMWAL_RELAYER_URL=https://relayer-staging.memory.walrus.xyz
```

Generate credentials at [staging.memory.walrus.xyz](https://staging.memory.walrus.xyz) (testnet).

When enabled, writes go to both PostgreSQL and MemWal. Reads prefer MemWal semantic recall with PostgreSQL fallback.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/memory/status` | Provider status (postgres / hybrid) |
| `GET` | `/memory/spaces` | Memory spaces with entry counts |
| `POST` | `/memory/sync` | Sync profile + collections to memory |

## Package

`@ripple-studio/memory` exposes the `MemoryClient` abstraction used by the API and future multi-agent expansion (PR-10).