import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CollectionsModule } from './collections/collections.module';
import { GenerationModule } from './generation/generation.module';
import { WalrusModule } from './walrus/walrus.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, HealthModule, CollectionsModule, GenerationModule, WalrusModule],
  controllers: [AppController],
})
export class AppModule {}