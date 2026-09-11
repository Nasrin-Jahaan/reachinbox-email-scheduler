import { Response, NextFunction } from 'express';
import { SchedulerService } from '../services/scheduler.service';
import { EmailService } from '../services/email.service';
import { SenderService } from '../services/sender.service';
import { AuthenticatedRequest } from '../types/index';
import { z } from 'zod';

export const scheduleEmailSchema = z.object({
  senderId: z.string().min(1, 'Sender ID is required'),
  recipients: z.array(z.string().email('Invalid email recipient')).min(1, 'At least one recipient is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Start time must be a valid ISO date string',
  }),
  delayBetweenEmailsSeconds: z.number().nonnegative().optional().default(0),
  hourlyLimit: z.number().positive().optional().default(200),
});

export class EmailController {
  static async scheduleEmails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { senderId } = req.body;

      const sender = await SenderService.validateSenderOwnership(userId, senderId);
      if (!sender) {
        return res.status(403).json({ error: 'Forbidden: Invalid sender ID or sender does not belong to you' });
      }

      const result = await SchedulerService.scheduleEmails(userId, req.body);

      return res.status(201).json({
        message: 'Emails scheduled successfully',
        scheduledCount: result.scheduledCount,
        emails: result.emails,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getEmails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const statusParam = req.query.status as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      let statusFilter: 'SCHEDULED' | 'SENT' | 'FAILED' | 'RATE_LIMITED' | 'PROCESSING' | undefined;

      if (statusParam) {
        const upper = statusParam.toUpperCase();
        if (['SCHEDULED', 'SENT', 'FAILED', 'RATE_LIMITED', 'PROCESSING'].includes(upper)) {
          statusFilter = upper as any;
        }
      }

      const result = await EmailService.getEmailsByUser(userId, statusFilter, page, limit);

      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
