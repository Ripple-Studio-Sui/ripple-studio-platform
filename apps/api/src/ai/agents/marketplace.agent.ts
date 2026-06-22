import { Injectable } from '@nestjs/common';
import type { AiAgentType } from '@ripple-studio/shared';
import type { ChatMessage } from '../openai.service';
import { appendSharedContext } from './base';
import type { Agent, AgentContext } from './types';

@Injectable()
export class MarketplaceAgent implements Agent {
  readonly type: AiAgentType = 'marketplace';
  readonly name = 'Marketplace Agent';
  readonly description = 'Listing strategy, pricing, and Sui marketplace launch';

  buildMessages(userMessage: string, history: ChatMessage[], context: AgentContext): ChatMessage[] {
    const parts = [
      'You are the Ripple Studio Marketplace Agent — a specialist in Sui NFT marketplace strategy.',
      'You advise on: TradePort, BlueMove, and Clutchy listing strategy, floor pricing, launch timing,',
      'royalty settings (TransferPolicy), Kiosk commerce, and pre-launch marketing checklist.',
      'Ripple Studio marketplace adapters are coming in PR-14; for now focus on strategy and readiness.',
      'Pre-launch checklist: metadata on Walrus ✓, images on Walrus ✓, royalty configured ✓, social posts drafted ✓.',
      'Recommend realistic pricing based on supply, rarity distribution, and Sui market norms.',
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