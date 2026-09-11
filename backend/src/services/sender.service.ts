import { prisma } from '../config/db';

export class SenderService {
  static async createSender(userId: string, data: { name: string; email: string }) {
    return prisma.sender.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
      },
    });
  }

  static async getSendersByUser(userId: string) {
    return prisma.sender.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async validateSenderOwnership(userId: string, senderId: string) {
    const sender = await prisma.sender.findUnique({
      where: { id: senderId },
    });

    if (!sender || sender.userId !== userId) {
      return null;
    }
    return sender;
  }
}
