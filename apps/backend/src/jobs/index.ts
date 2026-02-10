import { setupAuctionWorker } from './auction.processor';
import { initAutoReleaseJob, autoReleaseWorker } from './auto-release.job';

/**
 * Jobs initialization
 * Starts all BullMQ workers
 */
export const initJobs = () => {
  console.log('🏗️  Initializing background jobs...');

  const auctionWorker = setupAuctionWorker();

  // Initialize escrow auto-release job
  initAutoReleaseJob();

  console.log('🚀 Background workers started');

  return {
    auctionWorker,
    autoReleaseWorker,
  };
};
