import { Request, Response, NextFunction } from 'express';
import { SlackService } from '../services/slack.service';
import { AuthenticatedRequest } from '../types/index';
import { env } from '../config/env';

export class SlackController {
  static connect(req: Request, res: Response) {
    const scopes = encodeURIComponent('chat:write chat:write.public channels:read groups:read');
    const redirectUri = encodeURIComponent(env.SLACK_REDIRECT_URI);
    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${env.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${redirectUri}`;

    return res.redirect(slackAuthUrl);
  }

  static async callback(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code, state } = req.query;
      const userId = req.user?.userId || (state as string);

      if (!code || typeof code !== 'string') {
        return res.redirect(`${env.FRONTEND_URL}?slack_error=missing_code`);
      }

      if (!userId) {
        return res.redirect(`${env.FRONTEND_URL}/login?error=slack_unauthorized`);
      }

      await SlackService.handleSlackOAuthCallback(userId, code);
      return res.redirect(`${env.FRONTEND_URL}/slack/callback?success=true`);
    } catch (err) {
      next(err);
    }
  }

  static async disconnect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await SlackService.disconnectSlack(req.user!.userId);
      return res.json({ message: 'Slack disconnected successfully' });
    } catch (err) {
      next(err);
    }
  }
}
