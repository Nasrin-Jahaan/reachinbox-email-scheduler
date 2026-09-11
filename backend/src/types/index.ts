import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface ScheduleEmailInput {
  senderId: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime: string; // ISO Date String
  delayBetweenEmailsSeconds?: number;
  hourlyLimit?: number;
}

export interface EmailJobData {
  emailId: string;
  userId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  attempt?: number;
}
