import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { prisma } from '../config/db';

let transporter: nodemailer.Transporter | null = null;

export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (env.ETHEREAL_USER && env.ETHEREAL_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: env.ETHEREAL_USER,
        pass: env.ETHEREAL_PASSWORD,
      },
    });
    logger.info('📧 Using configured Ethereal SMTP user');
  } else {
    logger.info('📧 Creating automated development Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`📧 Created Ethereal test account: ${testAccount.user}`);
  }

  return transporter;
}

export class EmailService {
  static async sendEmail(options: {
    fromName: string;
    fromEmail: string;
    to: string;
    subject: string;
    body: string;
  }): Promise<{ messageId: string; previewUrl: string | false }> {
    const activeTransporter = await getTransporter();

    const info = await activeTransporter.sendMail({
      from: `"${options.fromName}" <${options.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #4f46e5;">${options.subject}</h2>
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #4f46e5;">
                <p style="white-space: pre-wrap;">${options.body}</p>
              </div>
              <footer style="margin-top: 24px; font-size: 12px; color: #6b7280;">
                Sent via ReachInbox Email Scheduler
              </footer>
             </div>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`🔗 Ethereal Email Preview URL: ${previewUrl}`);
    }

    return {
      messageId: info.messageId,
      previewUrl,
    };
  }

  static async getEmailsByUser(
    userId: string,
    statusFilter?: 'SCHEDULED' | 'SENT' | 'FAILED' | 'RATE_LIMITED' | 'PROCESSING',
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;
    const whereClause: any = { userId };

    if (statusFilter) {
      if (statusFilter === 'SCHEDULED') {
        whereClause.status = { in: ['SCHEDULED', 'PROCESSING', 'RATE_LIMITED'] };
      } else {
        whereClause.status = statusFilter;
      }
    }

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.email.count({ where: whereClause }),
    ]);

    return {
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
