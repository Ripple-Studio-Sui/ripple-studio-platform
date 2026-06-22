import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CollectionsModule } from './collections/collections.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, HealthModule, CollectionsModule],
  controllers: [AppController],
})
export class AppModule {}