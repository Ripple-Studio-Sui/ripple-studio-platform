import { Module } from '@nestjs/common';
import { GenerationModule } from '../generation/generation.module';
import { WalrusController } from './walrus.controller';
import { WalrusService } from './walrus.service';

@Module({
  imports: [GenerationModule],
  controllers: [WalrusController],
  providers: [WalrusService],
  exports: [WalrusService],
})
export class WalrusModule {}