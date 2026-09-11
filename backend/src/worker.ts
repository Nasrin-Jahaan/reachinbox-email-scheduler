import { createEmailWorker } from './queues/email.worker';
import { logger } from './utils/logger';

logger.info('🚀 Launching ReachInbox Background Worker Process...');

const worker = createEmailWorker();

process.on('SIGTERM', async () => {
  logger.info('⚠️ SIGTERM signal received. Closing worker gracefully...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('⚠️ SIGINT signal received. Closing worker gracefully...');
  await worker.close();
  process.exit(0);
});
