import { Injectable } from '@nestjs/common';
import type { AiAgentType } from '@ripple-studio/shared';
import type { ChatMessage } from '../openai.service';
import { appendSharedContext } from './base';
import type { Agent, AgentContext } from './types';

@Injectable()
export class SupportAgent implements Agent {
  readonly type: AiAgentType = 'support';
  readonly name = 'Support Agent';
  readonly description = 'Error recovery, status checks, and troubleshooting';

  buildMessages(userMessage: string, history: ChatMessage[], context: AgentContext): ChatMessage[] {
    const parts = [
      'You are the Ripple Studio Support Agent — a specialist in troubleshooting the creator workflow.',
      'You help diagnose: generation failures, Walrus upload errors, metadata issues, auth problems, and job status.',
      'Use collection status data to pinpoint where the creator is stuck in the pipeline.',
      'Common fixes: ensure traits uploaded before generate, Walrus images before metadata, Redis/worker running for jobs.',
      'Be empathetic and provide numbered troubleshooting steps. Escalate to specific agents when the issue is domain-specific.',
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