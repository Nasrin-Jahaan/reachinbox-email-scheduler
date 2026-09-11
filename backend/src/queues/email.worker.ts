import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, emailQueue } from './email.queue';
import { redisOptions } from '../config/redis';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { RateLimitService } from '../services/rateLimit.service';
import { EmailService } from '../services/email.service';
import { SlackService } from '../services/slack.service';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { EmailJobData } from '../types/index';
import { logger } from '../utils/logger';
import { getDelayUntil } from '../utils/time';

export async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { emailId, userId, senderId } = job.data;
  logger.info(`⚙️ Processing email job ${job.id} for database email ID ${emailId}`);

  // 1. Idempotency & Database state check
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: {
      sender: true,
      user: true,
    },
  });

  if (!email) {
    logger.warn(`⚠️ Email record ${emailId} not found in database. Skipping job.`);
    return;
  }

  // Strict Idempotency Protection: If already SENT, do NOT resend!
  if (email.status === 'SENT') {
    logger.info(`🛡️ Email ${emailId} is already marked as SENT in DB. Skipping duplicate send.`);
    return;
  }

  // 2. Minimum Delay (Provider Throttling) Check
  const { delayMs } = await RateLimitService.reserveSendSlot(senderId, env.MIN_DELAY_BETWEEN_EMAILS_MS);
  if (delayMs > 0) {
    logger.info(`⏳ Sender ${senderId} provider throttling active. Delaying send by ${delayMs}ms.`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // 3. Distributed Hourly Rate Limiting Check
  const rateLimitResult = await RateLimitService.checkAndIncrementHourlyLimit(
    senderId,
    env.MAX_EMAILS_PER_HOUR_PER_SENDER
  );

  if (!rateLimitResult.allowed && rateLimitResult.nextHourStart) {
    logger.warn(`🚨 Hourly limit reached for sender ${email.sender.email} (${rateLimitResult.currentCount}/${rateLimitResult.maxLimit}). Rescheduling email to ${rateLimitResult.nextHourStart.toISOString()}`);

    // Update email status to RATE_LIMITED in DB
    const updatedEmail = await prisma.email.update({
      where: { id: emailId },
      data: {
        status: 'RATE_LIMITED',
        scheduledAt: rateLimitResult.nextHourStart,
      },
    });

    await ElasticsearchService.updateEmailStatus(emailId, 'RATE_LIMITED');

    // Trigger Slack notification asynchronously
    SlackService.sendRateLimitNotification(
      userId,
      email.sender.email,
      rateLimitResult.maxLimit
    ).catch((err) => {
      logger.error(`❌ Slack notification error: ${err.message}`);
    });

    // Reschedule in BullMQ with next hour delay
    const rescheduleDelay = getDelayUntil(rateLimitResult.nextHourStart);
    await emailQueue.add('send-email', job.data, {
      jobId: `email-${emailId}-rescheduled-${rateLimitResult.nextHourStart.getTime()}`,
      delay: rescheduleDelay,
      attempts: 3,
    });

    return;
  }

  // 4. Update status to PROCESSING
  await prisma.email.update({
    where: { id: emailId },
    data: { status: 'PROCESSING' },
  });

  // 5. Send email via Nodemailer
  try {
    const result = await EmailService.sendEmail({
      fromName: email.sender.name,
      fromEmail: email.sender.email,
      to: email.recipient,
      subject: email.subject,
      body: email.body,
    });

    const now = new Date();

    // Update DB status to SENT
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: 'SENT',
        sentAt: now,
        messageId: result.messageId,
      },
    });

    // Update Elasticsearch
    await ElasticsearchService.indexEmail({
      ...email,
      status: 'SENT',
      sentAt: now,
    });

    logger.info(`✅ Email ${emailId} successfully sent to ${email.recipient} (Message ID: ${result.messageId})`);
  } catch (error: any) {
    logger.error(`❌ Failed to send email ${emailId}: ${error.message}`);

    // Mark as FAILED in DB
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: 'FAILED',
        errorMessage: error.message || 'Unknown sending error',
      },
    });

    await ElasticsearchService.updateEmailStatus(emailId, 'FAILED');
    throw error;
  }
}

export function createEmailWorker(): Worker {
  logger.info(`🚀 Starting Email Queue Worker with concurrency = ${env.WORKER_CONCURRENCY}`);

  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      await processEmailJob(job);
    },
    {
      connection: redisOptions,
      concurrency: env.WORKER_CONCURRENCY,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`❌ Worker job ${job?.id} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`❌ Worker encountered system error: ${err.message}`);
  });

  return worker;
}
