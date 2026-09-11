import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { JwtPayload } from '../types/index';

export class AuthService {
  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  }

  static async findOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: data.googleId }, { email: data.email }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: data.googleId,
          email: data.email,
          name: data.name,
          avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=6366f1&color=fff`,
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: data.googleId, avatar: data.avatar || user.avatar },
      });
    }

    const sendersCount = await prisma.sender.count({
      where: { userId: user.id },
    });

    if (sendersCount === 0) {
      await prisma.sender.create({
        data: {
          userId: user.id,
          name: user.name,
          email: user.email,
        },
      });
    }

    return user;
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        senders: true,
        slackConnection: {
          select: {
            workspaceName: true,
            connectedAt: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      senders: user.senders,
      slackConnected: !!user.slackConnection,
      slackWorkspace: user.slackConnection?.workspaceName || null,
      createdAt: user.createdAt,
    };
  }
}
