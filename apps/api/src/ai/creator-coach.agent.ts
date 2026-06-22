import { Injectable } from '@nestjs/common';
import type { ExperienceMode } from '@ripple-studio/shared';
import { RagService } from './rag.service';
import type { ChatMessage } from './openai.service';

export interface CoachContext {
  experienceMode: ExperienceMode;
  displayName?: string | null;
  memoryContext?: string;
  collection?: {
    id: string;
    name: string;
    status: string;
    supply: number;
    layerCount: number;
    nftCount: number;
    walrusUploaded: number;
    metadataGenerated: number;
  };
}

const MODE_INSTRUCTIONS: Record<ExperienceMode, string> = {
  beginner:
    'Explain concepts simply. Avoid jargon. Use step-by-step guidance. Encourage the creator and celebrate progress.',
  creator:
    'Be practical and concise. Focus on creative decisions, rarity strategy, and launch readiness. Assume basic NFT familiarity.',
  builder:
    'Be technical and direct. Reference Sui objects, Walrus blob IDs, Move concepts, and architecture when relevant. Skip basics.',
};

@Injectable()
export class CreatorCoachAgent {
  constructor(private readonly rag: RagService) {}

  buildMessages(userMessage: string, history: ChatMessage[], context: CoachContext): ChatMessage[] {
    const knowledge = this.rag.getContextForQuery(userMessage);
    const systemPrompt = this.buildSystemPrompt(context, knowledge);

    const recentHistory = history.slice(-10);
    return [{ role: 'system', content: systemPrompt }, ...recentHistory, { role: 'user', content: userMessage }];
  }

  private buildSystemPrompt(context: CoachContext, knowledge: string): string {
    const parts = [
      'You are the Ripple Studio Creator Coach — an AI guide for NFT creators on the Sui blockchain.',
      'You help with collection design, trait strategy, Walrus storage, metadata, and launch planning.',
      'Ripple Studio is a no-code platform: zkLogin auth → trait upload → generate → Walrus → metadata → deploy.',
      'Only answer questions about NFT creation, Sui ecosystem, and Ripple Studio. Politely decline off-topic requests.',
      `Coaching style (${context.experienceMode} mode): ${MODE_INSTRUCTIONS[context.experienceMode]}`,
    ];

    if (context.displayName) {
      parts.push(`Creator: ${context.displayName}`);
    }

    if (context.memoryContext) {
      parts.push(
        'Creator memory (from previous sessions and projects — use to personalize advice):',
        context.memoryContext,
      );
    }

    if (context.collection) {
      const c = context.collection;
      parts.push(
        `Active collection: "${c.name}" (status: ${c.status}, supply: ${c.supply}, layers: ${c.layerCount}, NFTs: ${c.nftCount}, Walrus uploads: ${c.walrusUploaded}, metadata records: ${c.metadataGenerated}).`,
        'Tailor advice to where they are in the workflow based on this status.',
      );
    }

    if (knowledge) {
      parts.push('Relevant Sui / Ripple Studio knowledge (use this to ground your answers):', knowledge);
    }

    parts.push('Keep responses under 300 words unless the user asks for detail. Use markdown sparingly.');

    return parts.join('\n\n');
  }
}