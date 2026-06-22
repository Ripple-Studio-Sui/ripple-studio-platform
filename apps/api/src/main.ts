import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  const uploadsDir = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`Ripple Studio API running on http://localhost:${port}`);
}

bootstrap();