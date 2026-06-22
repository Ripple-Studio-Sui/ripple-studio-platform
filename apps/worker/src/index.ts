import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { GenerationProcessor } from './generation/processor';
import { WalrusUploadProcessor } from './walrus/processor';
import { MetadataProcessor } from './metadata/processor';
import { prisma } from './prisma';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const generationProcessor = new GenerationProcessor(prisma);
const walrusProcessor = new WalrusUploadProcessor(prisma);
const metadataProcessor = new MetadataProcessor(prisma);

const generationWorker = new Worker(
  'nft-generation',
  async (job) => {
    console.log(`[generation] Starting job ${job.id} for collection ${job.data.collectionId}`);
    const result = await generationProcessor.process(job.data);
    console.log(`[generation] Completed: ${result.generated} NFTs (${result.duplicatesSkipped} dupes skipped)`);
    return result;
  },
  { connection, concurrency: 2 },
);

const walrusWorker = new Worker(
  'walrus-upload',
  async (job) => {
    console.log(`[walrus] Starting job ${job.id} for collection ${job.data.collectionId}`);
    const result = await walrusProcessor.process(job.data);
    console.log(`[walrus] Completed: ${result.uploaded} uploaded, ${result.failed} failed`);
    return result;
  },
  { connection, concurrency: 1 },
);

generationWorker.on('completed', (job) => {
  console.log(`[generation] Job ${job.id} completed`);
});

generationWorker.on('failed', (job, err) => {
  console.error(`[generation] Job ${job?.id} failed:`, err.message);
});

const metadataWorker = new Worker(
  'metadata-generation',
  async (job) => {
    console.log(`[metadata] Starting job ${job.id} for collection ${job.data.collectionId}`);
    const result = await metadataProcessor.process(job.data);
    console.log(
      `[metadata] Completed: ${result.generated} generated, ${result.uploaded} uploaded, ${result.failed} failed`,
    );
    return result;
  },
  { connection, concurrency: 1 },
);

walrusWorker.on('completed', (job) => {
  console.log(`[walrus] Job ${job.id} completed`);
});

walrusWorker.on('failed', (job, err) => {
  console.error(`[walrus] Job ${job?.id} failed:`, err.message);
});

metadataWorker.on('completed', (job) => {
  console.log(`[metadata] Job ${job.id} completed`);
});

metadataWorker.on('failed', (job, err) => {
  console.error(`[metadata] Job ${job?.id} failed:`, err.message);
});

console.log('Ripple Studio workers started');
console.log('  - nft-generation queue (concurrency: 2)');
console.log('  - walrus-upload queue (concurrency: 1)');
console.log('  - metadata-generation queue (concurrency: 1)');