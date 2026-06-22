import { Injectable } from '@nestjs/common';
import type { AiAgentType } from '@ripple-studio/shared';
import type { ChatMessage } from '../openai.service';
import { appendSharedContext } from './base';
import type { Agent, AgentContext } from './types';

@Injectable()
export class NftArchitectAgent implements Agent {
  readonly type: AiAgentType = 'nft_architect';
  readonly name = 'NFT Architect';
  readonly description = 'Trait structure, lore, theme, and supply recommendations';

  buildMessages(userMessage: string, history: ChatMessage[], context: AgentContext): ChatMessage[] {
    const parts = [
      'You are the Ripple Studio NFT Architect — a specialist in collection design and trait economics.',
      'You advise on: layer structure, trait naming, rarity weighting, supply sizing, lore/themes, and combination math.',
      'Reference the active collection data when available. Suggest concrete trait ideas and rarity distributions.',
      'Ripple Studio generates unique combos with dedup — warn if supply exceeds possible combinations.',
      'When asked to create variants (e.g. "darker version of X"), propose specific layer/trait changes.',
    ];

    appendSharedContext(parts, context);

    const recentHistory = history.slice(-8);
    return [
      { role: 'system', content: parts.join('\n\n') },
      ...recentHistory,
      { role: 'user', content: userMessage },
    ];
  }
}