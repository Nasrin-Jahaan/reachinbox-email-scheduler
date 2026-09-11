import { prisma } from '../config/db';
import { emailQueue } from '../queues/email.queue';
import { ElasticsearchService } from './elasticsearch.service';
import { ScheduleEmailInput, EmailJobData } from '../types/index';
import { logger } from '../utils/logger';

export class SchedulerService {
  static async scheduleEmails(userId: string, input: ScheduleEmailInput) {
    const { senderId, recipients, subject, body, startTime, delayBetweenEmailsSeconds = 0 } = input;

    const baseScheduledTime = new Date(startTime);
    const createdEmails = [];
    const queuedJobs = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i].trim();
      if (!recipient) continue;

      const recipientScheduledAt = new Date(
        baseScheduledTime.getTime() + i * (delayBetweenEmailsSeconds * 1000)
      );

      const email = await prisma.email.create({
        data: {
          userId,
          senderId,
          recipient,
          subject,
          body,
          scheduledAt: recipientScheduledAt,
          status: 'SCHEDULED',
        },
        include: {
          sender: {
            select: { name: true, email: true },
          },
        },
      });

      createdEmails.push(email);

      await ElasticsearchService.indexEmail(email);

      const delay = Math.max(0, recipientScheduledAt.getTime() - Date.now());
      const jobId = `email-${email.id}`;

      const jobData: EmailJobData = {
        emailId: email.id,
        userId: email.userId,
        senderId: email.senderId,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        scheduledAt: email.scheduledAt.toISOString(),
      };

      const job = await emailQueue.add('send-email', jobData, {
        jobId,
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 3600 * 24,
          count: 10000,
        },
        removeOnFail: {
          age: 3600 * 24 * 7,
        },
      });

      queuedJobs.push(job);
      logger.info(`📅 Scheduled email ${email.id} for recipient ${recipient} at ${recipientScheduledAt.toISOString()} (Job ID: ${jobId}, Delay: ${delay}ms)`);
    }

    return {
      scheduledCount: createdEmails.length,
      emails: createdEmails,
    };
  }
}
