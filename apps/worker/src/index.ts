import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { GenerationProcessor } from './generation/processor';
import { prisma } from './prisma';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const processor = new GenerationProcessor(prisma);

const generationWorker = new Worker(
  'nft-generation',
  async (job) => {
    console.log(`[generation] Starting job ${job.id} for collection ${job.data.collectionId}`);
    const result = await processor.process(job.data);
    console.log(`[generation] Completed: ${result.generated} NFTs (${result.duplicatesSkipped} dupes skipped)`);
    return result;
  },
  { connection, concurrency: 2 },
);

const walrusWorker = new Worker(
  'walrus-upload',
  async (job) => {
    console.log(`[walrus] Processing job ${job.id}:`, job.data);
    return { status: 'pending', message: 'Walrus upload coming in PR-6' };
  },
  { connection },
);

generationWorker.on('completed', (job) => {
  console.log(`[generation] Job ${job.id} completed`);
});

generationWorker.on('failed', (job, err) => {
  console.error(`[generation] Job ${job?.id} failed:`, err.message);
});

walrusWorker.on('failed', (job, err) => {
  console.error(`[walrus] Job ${job?.id} failed:`, err.message);
});

console.log('Ripple Studio workers started');
console.log('  - nft-generation queue (concurrency: 2)');
console.log('  - walrus-upload queue');