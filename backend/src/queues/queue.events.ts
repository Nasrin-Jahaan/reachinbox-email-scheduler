import { QueueEvents } from 'bullmq';
import { redisOptions } from '../config/redis';
import { EMAIL_QUEUE_NAME } from './email.queue';
import { logger } from '../utils/logger';

export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
  connection: redisOptions,
});

emailQueueEvents.on('completed', ({ jobId }) => {
  logger.info(`✅ Job completed successfully: ${jobId}`);
});

emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`❌ Job failed: ${jobId} - Reason: ${failedReason}`);
});
