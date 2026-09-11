import { Queue } from 'bullmq';
import { redisOptions } from '../config/redis';

export const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisOptions,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});
