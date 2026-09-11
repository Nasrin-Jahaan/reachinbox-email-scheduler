import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/index';
import { env } from '../config/env';

export class AuthController {
  static googleAuth(req: Request, res: Response) {
    const scope = encodeURIComponent('email profile openid');
    const redirectUri = encodeURIComponent(env.GOOGLE_CALLBACK_URL);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&prompt=select_account`;

    return res.redirect(googleAuthUrl);
  }

  static async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        return res.redirect(`${env.FRONTEND_URL}/login?error=missing_code`);
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: env.GOOGLE_CALLBACK_URL,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok || !tokenData.access_token) {
        return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleUser = await userResponse.json();

      const user = await AuthService.findOrCreateGoogleUser({
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split('@')[0],
        avatar: googleUser.picture,
      });

      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${env.FRONTEND_URL}/auth/callback?success=true`);
    } catch (err) {
      next(err);
    }
  }

  static async devLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.body.email || 'demo.user@reachinbox.ai';
      const name = req.body.name || 'Demo Engineer';

      const user = await AuthService.findOrCreateGoogleUser({
        googleId: `dev-google-id-${email}`,
        email,
        name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
      });

      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        message: 'Dev login successful',
        token,
        user,
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const profile = await AuthService.getUserProfile(req.user.userId);
      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  static logout(req: Request, res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax',
    });
    return res.json({ message: 'Logged out successfully' });
  }
}
