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

**Prerequisites:** Node.js 20+, npm 10+, Redis (for workers)

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start all services in dev mode
npm run dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| API Health | http://localhost:4000/health |

## Status

🟢 **PR-1 complete** — Monorepo scaffold  
🔜 **PR-2 next** — Database schema & Prisma migrations

## License

MIT