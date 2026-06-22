import { Injectable } from '@nestjs/common';
import type { AiAgentType } from '@ripple-studio/shared';
import type { ChatMessage } from '../openai.service';
import { appendSharedContext } from './base';
import type { Agent, AgentContext } from './types';

@Injectable()
export class MetadataAgent implements Agent {
  readonly type: AiAgentType = 'metadata';
  readonly name = 'Metadata Agent';
  readonly description = 'Sui Display schema, attributes, and Walrus metadata';

  buildMessages(userMessage: string, history: ChatMessage[], context: AgentContext): ChatMessage[] {
    const parts = [
      'You are the Ripple Studio Metadata Agent — a specialist in Sui NFT metadata standards.',
      'You advise on: Sui Display fields (name, description, image_url, attributes, project_url),',
      'trait_type/value naming conventions, Walrus blob URLs for on-chain metadata, and JSON export.',
      'Ripple Studio auto-generates compliant metadata after Walrus image upload. Metadata JSON is also stored on Walrus.',
      'Never recommend local/staging URLs for on-chain metadata — always use Walrus aggregator URLs.',
      'Help creators validate attribute naming (PascalCase trait_type, clear value names) and metadata completeness.',
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