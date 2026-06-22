import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { QueueService } from './queue.service';

@Module({
  imports: [AuthModule],
  controllers: [GenerationController],
  providers: [GenerationService, QueueService],
  exports: [GenerationService, QueueService],
})
export class GenerationModule {}