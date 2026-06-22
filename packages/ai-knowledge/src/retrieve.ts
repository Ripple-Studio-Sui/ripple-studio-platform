import { KNOWLEDGE_CHUNKS, type KnowledgeChunk } from './chunks';

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function scoreChunk(chunk: KnowledgeChunk, queryTokens: Set<string>): number {
  let score = 0;
  for (const keyword of chunk.keywords) {
    if (queryTokens.has(keyword.toLowerCase())) score += 3;
  }
  const contentTokens = tokenize(chunk.content);
  for (const token of queryTokens) {
    if (contentTokens.has(token)) score += 1;
  }
  return score;
}

export function retrieveKnowledge(query: string, limit = 4): KnowledgeChunk[] {
  const queryTokens = tokenize(query);
  if (!queryTokens.size) return KNOWLEDGE_CHUNKS.slice(0, limit);

  return [...KNOWLEDGE_CHUNKS]
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.chunk);
}

export function formatKnowledgeContext(chunks: KnowledgeChunk[]): string {
  if (!chunks.length) return '';
  return chunks.map((c) => `[${c.topic}]\n${c.content}`).join('\n\n');
}