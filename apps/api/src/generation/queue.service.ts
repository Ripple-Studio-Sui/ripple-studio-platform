import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly connection: IORedis;
  readonly generationQueue: Queue;

  constructor() {
    this.connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

    this.generationQueue = new Queue('nft-generation', { connection: this.connection });
  }

  async enqueueGeneration(collectionId: string, jobId: string) {
    await this.generationQueue.add(
      'generate',
      { collectionId, jobId },
      {
        jobId: `gen-${collectionId}-${jobId}`,
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  async onModuleDestroy() {
    await this.generationQueue.close();
    this.connection.disconnect();
  }
}