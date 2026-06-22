import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const generationWorker = new Worker(
  'nft-generation',
  async (job) => {
    console.log(`[generation] Processing job ${job.id}:`, job.data);
    // PR-5: trait combinatorics + rendering pipeline
    return { status: 'completed', processedAt: new Date().toISOString() };
  },
  { connection },
);

const walrusWorker = new Worker(
  'walrus-upload',
  async (job) => {
    console.log(`[walrus] Processing job ${job.id}:`, job.data);
    // PR-6: Walrus batch upload pipeline
    return { status: 'completed', processedAt: new Date().toISOString() };
  },
  { connection },
);

generationWorker.on('completed', (job) => {
  console.log(`[generation] Job ${job.id} completed`);
});

walrusWorker.on('failed', (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

console.log('Ripple Studio workers started');
console.log('  - nft-generation queue');
console.log('  - walrus-upload queue');