import { Injectable } from '@nestjs/common';
import type { AiAgentType } from '@ripple-studio/shared';
import { RagService } from '../rag.service';
import type { ChatMessage } from '../openai.service';
import { CreatorCoachAgent } from './creator-coach.agent';
import { DeploymentAgent } from './deployment.agent';
import { MetadataAgent } from './metadata.agent';
import { MarketplaceAgent } from './marketplace.agent';
import { NftArchitectAgent } from './nft-architect.agent';
import { IntentRouter } from './router';
import { SupportAgent } from './support.agent';
import type { Agent, AgentContext } from './types';

export interface AgentInfo {
  type: AiAgentType;
  name: string;
  description: string;
}

@Injectable()
export class AgentOrchestrator {
  private readonly agents: Map<AiAgentType, Agent>;

  constructor(
    private readonly router: IntentRouter,
    private readonly rag: RagService,
    coach: CreatorCoachAgent,
    architect: NftArchitectAgent,
    metadata: MetadataAgent,
    marketplace: MarketplaceAgent,
    deployment: DeploymentAgent,
    support: SupportAgent,
  ) {
    this.agents = new Map([
      [coach.type, coach],
      [architect.type, architect],
      [metadata.type, metadata],
      [marketplace.type, marketplace],
      [deployment.type, deployment],
      [support.type, support],
    ]);
  }

  listAgents(): AgentInfo[] {
    return [...this.agents.values()].map((a) => ({
      type: a.type,
      name: a.name,
      description: a.description,
    }));
  }

  resolveAgent(message: string, preferred?: AiAgentType): AiAgentType {
    return this.router.route(message, preferred);
  }

  getAgentInfo(type: AiAgentType): AgentInfo {
    const agent = this.agents.get(type) ?? this.agents.get('creator_coach')!;
    return { type: agent.type, name: agent.name, description: agent.description };
  }

  buildMessages(
    agentType: AiAgentType,
    userMessage: string,
    history: ChatMessage[],
    context: Omit<AgentContext, 'ragContext'>,
  ): ChatMessage[] {
    const agent = this.agents.get(agentType) ?? this.agents.get('creator_coach')!;
    const ragContext = this.rag.getContextForQuery(userMessage);

    return agent.buildMessages(userMessage, history, { ...context, ragContext });
  }
}