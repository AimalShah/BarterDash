import { Queue, Worker, Job } from 'bullmq';
import { EscrowService } from '../services/escrow.service';
import { redisConnection } from '../utils/redis';

// Use the shared Redis connection from utils/redis.ts

// Create the auto-release queue
export const autoReleaseQueue = new Queue('escrow-auto-release', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

/**
 * Auto-Release Worker
 * Processes escrow auto-release jobs
 */
export const autoReleaseWorker = new Worker(
  'escrow-auto-release',
  async (job: Job) => {
    console.log(`Processing auto-release job: ${job.id}`);

    const escrowService = new EscrowService();
    const releasedCount = await escrowService.processAutoRelease();

    return { released: releasedCount };
  },
  { connection: redisConnection },
);

// Worker event handlers
autoReleaseWorker.on('completed', (job, result) => {
  console.log(
    `Auto-release job ${job.id} completed. Released ${result.released} escrows.`,
  );
});

autoReleaseWorker.on('failed', (job, err) => {
  console.error(`Auto-release job ${job?.id} failed:`, err);
});

/**
 * Schedule the auto-release job
 * Runs every hour to check for escrows ready to be released
 */
export async function scheduleAutoReleaseJob(): Promise<void> {
  // Remove any existing repeatable jobs
  const repeatableJobs = await autoReleaseQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await autoReleaseQueue.removeRepeatableByKey(job.key);
  }

  // Add repeatable job - runs every hour
  await autoReleaseQueue.add(
    'process-auto-release',
    {},
    {
      repeat: {
        pattern: '0 * * * *', // Every hour at minute 0
      },
    },
  );

  console.log('✅ Escrow auto-release job scheduled (runs every hour)');
}

/**
 * Initialize the auto-release job system
 */
export function initAutoReleaseJob(): void {
  scheduleAutoReleaseJob().catch((err) => {
    console.error('Failed to schedule auto-release job:', err);
  });
}
