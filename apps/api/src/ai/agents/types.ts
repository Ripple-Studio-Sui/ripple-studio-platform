import type { AiAgentType, ExperienceMode } from '@ripple-studio/shared';
import type { ChatMessage } from '../openai.service';

export interface CollectionContext {
  id: string;
  name: string;
  status: string;
  supply: number;
  layerCount: number;
  nftCount: number;
  walrusUploaded: number;
  metadataGenerated: number;
  traitLayers?: Array<{ name: string; assetCount: number }>;
  royaltyBps?: number;
}

export interface AgentContext {
  experienceMode: ExperienceMode;
  displayName?: string | null;
  memoryContext?: string;
  ragContext?: string;
  collection?: CollectionContext;
}

export interface Agent {
  readonly type: AiAgentType;
  readonly name: string;
  readonly description: string;
  buildMessages(userMessage: string, history: ChatMessage[], context: AgentContext): ChatMessage[];
}

export const MODE_INSTRUCTIONS: Record<ExperienceMode, string> = {
  beginner:
    'Explain concepts simply. Avoid jargon. Use step-by-step guidance. Encourage the creator and celebrate progress.',
  creator:
    'Be practical and concise. Focus on creative decisions, rarity strategy, and launch readiness. Assume basic NFT familiarity.',
  builder:
    'Be technical and direct. Reference Sui objects, Walrus blob IDs, Move concepts, and architecture when relevant. Skip basics.',
};