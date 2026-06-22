# AI Assistant Setup

PR-8 added the Creator Coach. PR-10 expands it into a multi-agent system with intent routing. See [AGENTS.md](./AGENTS.md) for agent types and routing behavior.

## Requirements

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | OpenAI API key (required for chat) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model for coaching responses |

## Features

- **Multi-agent routing** — Creator Coach, NFT Architect, Metadata, Marketplace, Deployment, Support
- **Auto or manual agent** — intent router picks a specialist, or pin an agent in the UI
- **SSE streaming** — token-by-token responses via `POST /ai/chat`
- **Sui docs RAG** — keyword retrieval over curated knowledge chunks (Sui, Walrus, zkLogin, workflow)
- **Context-aware** — adapts to user `experienceMode` (beginner / creator / builder)
- **Collection context** — when viewing a collection, agents know status, supply, Walrus/metadata progress

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/ai/agents` | List available agents |
| `POST` | `/ai/sessions` | Create chat session |
| `GET` | `/ai/sessions` | List recent sessions |
| `GET` | `/ai/sessions/:id/messages` | Message history |
| `POST` | `/ai/chat` | SSE streaming chat (`agentType`: `"auto"` or explicit) |

### SSE Event Format

```
data: {"type":"session","sessionId":"..."}
data: {"type":"agent","agentType":"metadata","agentName":"Metadata"}
data: {"type":"token","content":"Hello"}
data: {"type":"done","messageId":"..."}
data: [DONE]
```

## UI

The **AI Assistant** sidebar appears on authenticated pages (dashboard, create wizard, collection view). Use the agent picker for Auto routing or a fixed specialist. Routed agent name appears on each assistant reply.

## MemWal Memory

PR-9 integrates persistent creator memory. The Coach recalls profile, collection, and conversation memories before each response. See `docs/MEMWAL_SETUP.md` for configuration.