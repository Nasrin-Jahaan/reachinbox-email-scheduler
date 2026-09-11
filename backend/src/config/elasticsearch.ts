import { Client } from '@elastic/elasticsearch';
import { env } from './env';

export const esClient = new Client({
  node: env.ELASTICSEARCH_NODE,
  maxRetries: 3,
  requestTimeout: 10000,
});

export const EMAIL_INDEX = 'emails';

export async function initElasticsearchIndex() {
  try {
    const exists = await esClient.indices.exists({ index: EMAIL_INDEX });
    if (!exists) {
      await esClient.indices.create({
        index: EMAIL_INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            userId: { type: 'keyword' },
            senderId: { type: 'keyword' },
            recipient: { type: 'keyword' },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' },
            createdAt: { type: 'date' }
          }
        }
      });
      console.log(`🔎 Created Elasticsearch index: ${EMAIL_INDEX}`);
    }
  } catch (err: any) {
    console.warn(`⚠️ Elasticsearch initialization warning (app will run with graceful fallback): ${err.message}`);
  }
}
