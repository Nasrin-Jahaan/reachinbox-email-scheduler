import { Response, NextFunction } from 'express';
import { SenderService } from '../services/sender.service';
import { AuthenticatedRequest } from '../types/index';
import { z } from 'zod';

export const createSenderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

export class SenderController {
  static async getSenders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const senders = await SenderService.getSendersByUser(req.user!.userId);
      return res.json({ senders });
    } catch (err) {
      next(err);
    }
  }

  static async createSender(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sender = await SenderService.createSender(req.user!.userId, req.body);
      return res.status(201).json({
        message: 'Sender created successfully',
        sender,
      });
    } catch (err) {
      next(err);
    }
  }
}
