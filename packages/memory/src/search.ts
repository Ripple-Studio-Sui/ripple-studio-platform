export function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

export function scoreText(query: string, content: string): number {
  const queryTokens = tokenize(query);
  if (!queryTokens.size) return 0;

  const contentTokens = tokenize(content);
  let score = 0;
  for (const token of queryTokens) {
    if (contentTokens.has(token)) score += 1;
  }
  return score / queryTokens.size;
}