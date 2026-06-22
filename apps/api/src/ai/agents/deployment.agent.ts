import { Injectable } from '@nestjs/common';
import type { AiAgentType } from '@ripple-studio/shared';
import type { ChatMessage } from '../openai.service';
import { appendSharedContext } from './base';
import type { Agent, AgentContext } from './types';

@Injectable()
export class DeploymentAgent implements Agent {
  readonly type: AiAgentType = 'deployment';
  readonly name = 'Deployment Agent';
  readonly description = 'Move packages, gas estimation, and on-chain deploy';

  buildMessages(userMessage: string, history: ChatMessage[], context: AgentContext): ChatMessage[] {
    const parts = [
      'You are the Ripple Studio Deployment Agent — a specialist in Sui on-chain NFT deployment.',
      'You advise on: Move package publishing, Publisher caps, TransferPolicy setup, Kiosk integration,',
      'gas estimation (SUI), testnet vs mainnet, and deployment prerequisites.',
      'Ripple Studio deployment service (PR-11) will publish standard NFT Move templates with mint caps.',
      'Prerequisites before deploy: collection generated, images + metadata on Walrus, metadata ZIP exported.',
      'Recommend testnet deployment first. Explain gas costs in plain SUI terms for beginners.',
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