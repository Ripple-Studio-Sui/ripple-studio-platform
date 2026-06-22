export type AiAgentType =
  | 'creator_coach'
  | 'nft_architect'
  | 'metadata'
  | 'marketplace'
  | 'deployment'
  | 'support';

export const AI_AGENT_TYPES: AiAgentType[] = [
  'creator_coach',
  'nft_architect',
  'metadata',
  'marketplace',
  'deployment',
  'support',
];

export const AI_AGENT_LABELS: Record<AiAgentType, string> = {
  creator_coach: 'Creator Coach',
  nft_architect: 'NFT Architect',
  metadata: 'Metadata',
  marketplace: 'Marketplace',
  deployment: 'Deployment',
  support: 'Support',
};

export const AI_AGENT_DESCRIPTIONS: Record<AiAgentType, string> = {
  creator_coach: 'Onboarding, education, and workflow guidance',
  nft_architect: 'Trait structure, lore, theme, and supply',
  metadata: 'Sui Display schema and Walrus metadata',
  marketplace: 'Listing strategy and pricing',
  deployment: 'Move packages and on-chain deploy',
  support: 'Troubleshooting and error recovery',
};

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

export interface AgentInfo {
  type: AiAgentType;
  name: string;
  description: string;
}

export interface CreateAiSessionInput {
  collectionId?: string;
  agentType?: AiAgentType;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  collectionId?: string;
  agentType?: AiAgentType | 'auto';
}

export type ChatStreamEvent =
  | { type: 'session'; sessionId: string }
  | { type: 'agent'; agentType: AiAgentType; agentName: string }
  | { type: 'token'; content: string }
  | { type: 'done'; messageId: string }
  | { type: 'error'; message: string };