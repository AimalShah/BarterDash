import { Worker, Job, Queue } from 'bullmq';
import { redisConnection } from '../utils/redis';
import { AuctionsService } from '../services/auctions.service';

/**
 * Auction Processor
 * Handles scheduled auction jobs:
 * - start-auction: Start a pending/scheduled auction
 * - end-auction: Finalize an active auction
 */

export const setupAuctionWorker = () => {
  const worker = new Worker(
    'auctions',
    async (job: Job) => {
      console.log(`👷 Processing job ${job.id} of type ${job.name}`);

      // Create service instance per job to avoid stale connections
      const auctionsService = new AuctionsService();

      switch (job.name) {
        case 'start-auction': {
          console.log(`🚀 Starting auction ${job.data.auctionId}`);
          const startResult = await auctionsService.startAuction(
            job.data.auctionId,
          );
          if (startResult.isErr()) {
            throw new Error(startResult.error.message);
          }
          console.log(`✅ Auction ${job.data.auctionId} is now active`);
          return startResult.value;
        }

        case 'end-auction': {
          console.log(`🏁 Ending auction ${job.data.auctionId}`);
          const endResult = await auctionsService.finalize(job.data.auctionId);
          if (endResult.isErr()) {
            throw new Error(endResult.error.message);
          }
          console.log(
            `✅ Auction ${job.data.auctionId} finalized:`,
            endResult.value,
          );
          return endResult.value;
        }

        default:
          console.warn(`❓ Unknown job name: ${job.name}`);
          return;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process up to 5 jobs concurrently
    },
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  return worker;
};

// Export queue for adding jobs
export const auctionQueue = new Queue('auctions', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});
