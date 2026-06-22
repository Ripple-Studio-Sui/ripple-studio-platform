import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { CreatorCoachAgent } from './creator-coach.agent';
import { OpenAiService } from './openai.service';
import { RagService } from './rag.service';

@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [AiService, OpenAiService, RagService, CreatorCoachAgent],
  exports: [AiService],
})
export class AiModule {}