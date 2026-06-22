# AI Creator Coach Setup

PR-8 adds the Creator Coach — a streaming AI assistant with Sui docs RAG.

## Requirements

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | OpenAI API key (required for chat) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model for coaching responses |

## Features

- **Single agent MVP** — Creator Coach (`creator_coach`)
- **SSE streaming** — token-by-token responses via `POST /ai/chat`
- **Sui docs RAG** — keyword retrieval over curated knowledge chunks (Sui, Walrus, zkLogin, workflow)
- **Context-aware** — adapts to user `experienceMode` (beginner / creator / builder)
- **Collection context** — when viewing a collection, coach knows status, supply, Walrus/metadata progress

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ai/sessions` | Create chat session |
| `GET` | `/ai/sessions` | List recent sessions |
| `GET` | `/ai/sessions/:id/messages` | Message history |
| `POST` | `/ai/chat` | SSE streaming chat |

### SSE Event Format

```
data: {"type":"session","sessionId":"..."}
data: {"type":"token","content":"Hello"}
data: {"type":"done","messageId":"..."}
data: [DONE]
```

## UI

The **Creator Coach** sidebar appears on authenticated pages (dashboard, create wizard, collection view). Click the floating button to open chat.

## MemWal

Persistent cross-session memory arrives in PR-9. Until then, conversation history is stored in PostgreSQL (`ai_sessions` + `ai_messages`).