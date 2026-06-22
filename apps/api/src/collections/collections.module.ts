import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { TraitsService } from './traits.service';

@Module({
  imports: [AuthModule],
  controllers: [CollectionsController],
  providers: [CollectionsService, TraitsService],
})
export class CollectionsModule {}