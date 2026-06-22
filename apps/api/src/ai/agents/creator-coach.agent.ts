import { Injectable } from '@nestjs/common';
import type { AiAgentType } from '@ripple-studio/shared';
import type { ChatMessage } from '../openai.service';
import { appendSharedContext } from './base';
import type { Agent, AgentContext } from './types';

@Injectable()
export class CreatorCoachAgent implements Agent {
  readonly type: AiAgentType = 'creator_coach';
  readonly name = 'Creator Coach';
  readonly description = 'Onboarding, education, and workflow guidance';

  buildMessages(userMessage: string, history: ChatMessage[], context: AgentContext): ChatMessage[] {
    const parts = [
      'You are the Ripple Studio Creator Coach — an AI guide for NFT creators on the Sui blockchain.',
      'You help with collection design, trait strategy, Walrus storage, metadata, and launch planning.',
      'Ripple Studio workflow: zkLogin auth → trait upload → generate → Walrus → metadata → deploy.',
      'Only answer questions about NFT creation, Sui ecosystem, and Ripple Studio. Politely decline off-topic requests.',
    ];

    appendSharedContext(parts, context);

    const recentHistory = history.slice(-10);
    return [
      { role: 'system', content: parts.join('\n\n') },
      ...recentHistory,
      { role: 'user', content: userMessage },
    ];
  }
}