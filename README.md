# Ripple Studio

> A ripple starts with a single drop. One idea becomes a collection. One collection becomes a community.

**Ripple Studio** is an AI-powered, no-code NFT creation and deployment platform built for the Sui ecosystem.

Think: **Canva + Bueno + ChatGPT + Shopify + Sui**

## Vision

Help creators go from **idea → design → generation → storage → deployment → marketplace → marketing** without writing code.

## Core Modules

| Module | Purpose |
|--------|---------|
| **Ripple Create** | No-code collection builder with trait layers, rarity, and batch generation |
| **Ripple AI** | Persistent AI companion (NFT expert, Sui guide, launch strategist) |
| **Ripple Memory** | Creator memory layer powered by MemWal |
| **Ripple Metadata** | Automatic Sui-compatible metadata generation |
| **Ripple Vault** | Decentralized asset storage on Walrus |
| **Ripple Identity** | zkLogin authentication — no seed phrases |
| **Ripple Deploy** | One-click on-chain deployment to Sui |
| **Ripple Launch** | Marketplace distribution (TradePort, BlueMove, Clutchy) |
| **Ripple Insights** | AI market intelligence |
| **Ripple Marketing** | AI-generated promotional content |

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** NestJS, PostgreSQL, Redis
- **Blockchain:** Sui SDK, Move, zkLogin
- **Storage:** Walrus, MemWal
- **AI:** Multi-agent architecture

## Documentation

- [Platform Design Document](./docs/DESIGN.md) — Full system architecture, database schema, roadmap
- [Auth Setup Guide](./docs/AUTH_SETUP.md) — Google/Apple OAuth + zkLogin configuration

## Monorepo Structure

```
ripple-studio-platform/
├── apps/
│   ├── web/        # Next.js 15 frontend
│   ├── api/        # NestJS backend API
│   └── worker/     # BullMQ background jobs
├── packages/
│   ├── shared/     # Shared types & constants
│   └── typescript-config/
└── docs/
    └── DESIGN.md   # Full platform architecture
```

## Getting Started

**Prerequisites:** Node.js 20+, npm 10+, Docker (for Postgres + Redis)

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start Postgres + Redis
docker compose up -d

# Run database migrations
cd apps/api && npm run db:migrate:deploy && npm run db:seed && cd ../..

# Start all services in dev mode (web + api + worker)
npm run dev
```

Run the worker separately if not included in turbo dev:

```bash
cd apps/worker && npm run dev
```

### Database

16 tables across users, collections, NFTs, deployments, payments, and jobs.  
Schema: `apps/api/prisma/schema.prisma`  
Migration: `apps/api/prisma/migrations/20250622120000_init/`

```bash
# Useful commands (from apps/api)
npm run db:studio    # Visual DB browser
npm run db:migrate   # Create new migrations
npm run db:seed      # Seed demo user + sample collection
```

### Trait folder structure

Organize traits as `LayerName/trait-file.png`:

```
my-collection/
├── Background/
│   ├── blue.png
│   └── neon.png
├── Eyes/
│   ├── normal.png
│   └── laser.png
└── Hat/
    ├── cap.png
    └── crown.png
```

Upload the parent folder in the create wizard (Step 2).

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| API Health | http://localhost:4000/health |

## Status

🟢 **PR-1 complete** — Monorepo scaffold  
🟢 **PR-2 complete** — Database schema & Prisma migrations  
🟢 **PR-3 complete** — zkLogin authentication (Google + Apple)  
🟢 **PR-4 complete** — Collection builder wizard with trait upload  
🟢 **PR-5 complete** — NFT generation worker (Sharp compositing + rarity)  
🔜 **PR-6 next** — Walrus storage upload

## License

MIT