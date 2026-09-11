import { WebClient } from '@slack/web-api';
import { prisma } from '../config/db';
import { redisClient } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { getHourWindowString } from '../utils/time';

export class SlackService {
  static async handleSlackOAuthCallback(userId: string, code: string) {
    try {
      const client = new WebClient();
      const response = await client.oauth.v2.access({
        client_id: env.SLACK_CLIENT_ID,
        client_secret: env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: env.SLACK_REDIRECT_URI,
      });

      if (!response.ok || !response.access_token) {
        throw new Error(response.error || 'Failed to exchange Slack OAuth code');
      }

      const workspaceId = response.team?.id || 'unknown-team';
      const workspaceName = response.team?.name || 'Slack Workspace';
      const accessToken = response.access_token;

      const connection = await prisma.slackConnection.upsert({
        where: { userId },
        update: {
          workspaceId,
          workspaceName,
          accessToken,
          updatedAt: new Date(),
        },
        create: {
          userId,
          workspaceId,
          workspaceName,
          accessToken,
        },
      });

      logger.info(`💬 Slack connection established for user ${userId} (Workspace: ${workspaceName})`);
      return connection;
    } catch (err: any) {
      logger.error(`❌ Slack OAuth error: ${err.message}`);
      throw err;
    }
  }

  static async disconnectSlack(userId: string) {
    return prisma.slackConnection.deleteMany({
      where: { userId },
    });
  }

  static async sendRateLimitNotification(userId: string, senderEmail: string, hourlyLimit: number) {
    try {
      const slackConnection = await prisma.slackConnection.findUnique({
        where: { userId },
      });

      if (!slackConnection) {
        logger.debug(`ℹ️ Slack notification skipped for user ${userId} (No Slack connection found)`);
        return false;
      }

      const hourWindow = getHourWindowString();
      const dedupKey = `slack-rate-limit-notified:${senderEmail}:${hourWindow}`;

      const alreadyNotified = await redisClient.get(dedupKey);
      if (alreadyNotified) {
        logger.debug(`ℹ️ Slack notification already sent for sender ${senderEmail} in hour window ${hourWindow}`);
        return false;
      }

      const client = new WebClient(slackConnection.accessToken);

      const messageBlocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '⚠️ Email Rate Limit Reached',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sender:*\n${senderEmail}`,
            },
            {
              type: 'mrkdwn',
              text: `*Hourly Limit:*\n${hourlyLimit} emails`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Remaining emails are being automatically delayed until the next available hour window.',
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*ReachInbox Email Scheduler* • ${new Date().toISOString()}`,
            },
          ],
        },
      ];

      const channelsRes = await client.conversations.list({ types: 'public_channel,private_channel', limit: 5 });
      const channelId = channelsRes.channels?.[0]?.id;

      if (!channelId) {
        logger.warn(`⚠️ No public/private channel available to send Slack notification for user ${userId}`);
        return false;
      }

      await client.chat.postMessage({
        channel: channelId,
        text: `⚠️ Email Rate Limit Reached for ${senderEmail}. Remaining emails delayed to next hour.`,
        blocks: messageBlocks,
      });

      await redisClient.set(dedupKey, '1', 'EX', 3600);
      logger.info(`🚨 Sent Slack rate limit notification for sender ${senderEmail} to workspace ${slackConnection.workspaceName}`);
      return true;
    } catch (err: any) {
      logger.error(`❌ Failed to send Slack rate limit notification: ${err.message}`);
      return false;
    }
  }
}
