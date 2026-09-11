import { esClient, EMAIL_INDEX } from '../config/elasticsearch';
import { logger } from '../utils/logger';
import { prisma } from '../config/db';

export class ElasticsearchService {
  static async indexEmail(email: {
    id: string;
    userId: string;
    senderId: string;
    recipient: string;
    subject: string;
    body: string;
    status: string;
    scheduledAt: Date;
    sentAt?: Date | null;
    createdAt?: Date;
  }) {
    try {
      await esClient.index({
        index: EMAIL_INDEX,
        id: email.id,
        document: {
          id: email.id,
          userId: email.userId,
          senderId: email.senderId,
          recipient: email.recipient,
          subject: email.subject,
          body: email.body,
          status: email.status,
          scheduledAt: email.scheduledAt.toISOString(),
          sentAt: email.sentAt ? email.sentAt.toISOString() : null,
          createdAt: email.createdAt ? email.createdAt.toISOString() : new Date().toISOString(),
        },
      });
      logger.debug(`🔎 Indexed email in Elasticsearch: ${email.id}`);
    } catch (err: any) {
      logger.warn(`⚠️ Failed to index email ${email.id} in Elasticsearch: ${err.message}`);
    }
  }

  static async updateEmailStatus(emailId: string, status: string, sentAt?: Date | null) {
    try {
      await esClient.update({
        index: EMAIL_INDEX,
        id: emailId,
        doc: {
          status,
          sentAt: sentAt ? sentAt.toISOString() : null,
        },
      });
    } catch (err: any) {
      logger.warn(`⚠️ Failed to update email status in Elasticsearch for ${emailId}: ${err.message}`);
    }
  }

  static async searchEmails(userId: string, queryText: string, page = 1, limit = 20) {
    try {
      const from = (page - 1) * limit;
      const response = await esClient.search({
        index: EMAIL_INDEX,
        from,
        size: limit,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: queryText,
                  fields: ['recipient^3', 'subject^2', 'body', 'status'],
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: [
              { term: { userId } },
            ],
          },
        },
        sort: [{ scheduledAt: { order: 'desc' } }],
      });

      const hits = response.hits.hits.map((hit: any) => hit._source);
      const total = typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0;

      return {
        data: hits,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        source: 'elasticsearch',
      };
    } catch (err: any) {
      logger.warn(`⚠️ Elasticsearch search failed (${err.message}). Falling back to Prisma database search.`);

      const skip = (page - 1) * limit;
      const whereClause = {
        userId,
        OR: [
          { recipient: { contains: queryText, mode: 'insensitive' as const } },
          { subject: { contains: queryText, mode: 'insensitive' as const } },
          { body: { contains: queryText, mode: 'insensitive' as const } },
        ],
      };

      const [data, total] = await Promise.all([
        prisma.email.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { scheduledAt: 'desc' },
          include: { sender: { select: { name: true, email: true } } },
        }),
        prisma.email.count({ where: whereClause }),
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        source: 'database-fallback',
      };
    }
  }
}
