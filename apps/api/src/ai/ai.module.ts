import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemoryModule } from '../memory/memory.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CreatorCoachAgent } from './agents/creator-coach.agent';
import { DeploymentAgent } from './agents/deployment.agent';
import { MetadataAgent } from './agents/metadata.agent';
import { MarketplaceAgent } from './agents/marketplace.agent';
import { NftArchitectAgent } from './agents/nft-architect.agent';
import { AgentOrchestrator } from './agents/orchestrator.service';
import { IntentRouter } from './agents/router';
import { SupportAgent } from './agents/support.agent';
import { OpenAiService } from './openai.service';
import { RagService } from './rag.service';

@Module({
  imports: [AuthModule, MemoryModule],
  controllers: [AiController],
  providers: [
    AiService,
    OpenAiService,
    RagService,
    IntentRouter,
    AgentOrchestrator,
    CreatorCoachAgent,
    NftArchitectAgent,
    MetadataAgent,
    MarketplaceAgent,
    DeploymentAgent,
    SupportAgent,
  ],
  exports: [AiService],
})
export class AiModule {}