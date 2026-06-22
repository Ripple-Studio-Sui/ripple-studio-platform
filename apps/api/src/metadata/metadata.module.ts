import { Module } from '@nestjs/common';
import { GenerationModule } from '../generation/generation.module';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';

@Module({
  imports: [GenerationModule],
  controllers: [MetadataController],
  providers: [MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}