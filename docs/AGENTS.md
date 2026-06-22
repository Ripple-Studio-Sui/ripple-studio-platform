# Multi-Agent AI System

PR-10 expands the Creator Coach into a multi-agent system with intent-based routing.

## Agents

| Type | Name | Focus |
|------|------|-------|
| `creator_coach` | Creator Coach | Onboarding, education, workflow guidance (default) |
| `nft_architect` | NFT Architect | Trait layers, rarity, lore, theme, supply |
| `metadata` | Metadata | Sui Display schema, Walrus metadata, ZIP export |
| `marketplace` | Marketplace | Listing strategy, pricing, secondary sales |
| `deployment` | Deployment | Move packages, gas, mint, testnet/mainnet deploy |
| `support` | Support | Troubleshooting, job status, error recovery |

## Routing

When `agentType` is omitted or set to `"auto"`, the **Intent Router** scores the user message against keyword rules and picks the highest-scoring specialist. If no keywords match, the request goes to **Creator Coach**.

Examples:

- "How do I export metadata as a ZIP?" → **Metadata**
- "What floor price should I set?" → **Marketplace**
- "Deploy to testnet" → **Deployment**
- "My Walrus upload failed" → **Support**
- "Help me design trait rarity" → **NFT Architect**

### Manual override

Pass an explicit `agentType` in `POST /ai/chat` to skip auto-routing:

```json
{
  "message": "Review my trait structure",
  "agentType": "nft_architect"
}
```

The web UI agent picker sends `"auto"` or a specific agent type on every message.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/ai/agents` | List available agents (type, name, description) |
| `POST` | `/ai/chat` | SSE streaming chat with routing |

### SSE event sequence

```
data: {"type":"session","sessionId":"..."}
data: {"type":"agent","agentType":"metadata","agentName":"Metadata"}
data: {"type":"token","content":"..."}
data: {"type":"done","messageId":"..."}
data: [DONE]
```

The `agent` event tells the client which specialist handled the message. Session `agentType` is updated per routed agent.

## Architecture

```
apps/api/src/ai/
├── agents/
│   ├── router.ts              # IntentRouter (keyword scoring)
│   ├── orchestrator.service.ts
│   ├── creator-coach.agent.ts
│   ├── nft-architect.agent.ts
│   ├── metadata.agent.ts
│   ├── marketplace.agent.ts
│   ├── deployment.agent.ts
│   └── support.agent.ts
├── ai.service.ts              # Session + stream orchestration
└── rag.service.ts             # Shared Sui docs RAG context
```

Each agent implements `buildMessages()` with a specialist system prompt. The orchestrator injects shared context: user experience mode, collection state, MemWal memory, and RAG chunks.

## UI

The **AI Assistant** sidebar (floating button on authenticated pages) includes:

- **Agent picker** — Auto (route by intent) or a fixed specialist
- **Routed agent badge** — Shown on assistant messages and while streaming
- **Agent-specific suggestions** — Starter prompts per agent

## Configuration

No additional environment variables beyond [AI_SETUP.md](./AI_SETUP.md) (`OPENAI_API_KEY`, `OPENAI_MODEL`). MemWal memory from PR-9 is shared across all agents.