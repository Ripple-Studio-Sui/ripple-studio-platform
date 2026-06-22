import type {
  AgentInfo,
  AiMessage,
  AiSession,
  ChatRequest,
  ChatStreamEvent,
  CreateAiSessionInput,
} from '@ripple-studio/shared';
import { API_ROUTES } from '@ripple-studio/shared';
import { apiFetch } from './api';
import { getAccessToken, getRefreshToken, setTokens } from './auth/storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function createAiSession(input: CreateAiSessionInput = {}): Promise<AiSession> {
  return apiFetch<AiSession>('/ai/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listAiSessions(): Promise<AiSession[]> {
  return apiFetch<AiSession[]>('/ai/sessions');
}

export async function getAiMessages(sessionId: string): Promise<AiMessage[]> {
  return apiFetch<AiMessage[]>(`/ai/sessions/${sessionId}/messages`);
}

export async function listAgents(): Promise<AgentInfo[]> {
  return apiFetch<AgentInfo[]>('/ai/agents');
}

async function authorizedFetch(path: string, options: RequestInit): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  let token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    const refreshRes = await fetch(`${API_URL}${API_ROUTES.authRefresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      headers.set('Authorization', `Bearer ${data.tokens.accessToken}`);
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    }
  }

  return res;
}

export async function streamChat(
  request: ChatRequest,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const res = await authorizedFetch('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `Chat failed (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        onEvent(JSON.parse(data) as ChatStreamEvent);
      } catch {
        /* skip malformed */
      }
    }
  }
}