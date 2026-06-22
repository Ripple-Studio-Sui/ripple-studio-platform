export type AiAgentType = 'creator_coach';

export type AiMessageRole = 'user' | 'assistant' | 'system';

export interface AiMessage {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
}

export interface AiSession {
  id: string;
  agentType: AiAgentType;
  collectionId?: string;
  createdAt: string;
  messageCount: number;
}

export interface CreateAiSessionInput {
  collectionId?: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  collectionId?: string;
}

export type ChatStreamEvent =
  | { type: 'session'; sessionId: string }
  | { type: 'token'; content: string }
  | { type: 'done'; messageId: string }
  | { type: 'error'; message: string };