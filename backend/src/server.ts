import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { initElasticsearchIndex } from './config/elasticsearch';

async function startServer() {
  await initElasticsearchIndex();

  app.listen(env.PORT, () => {
    logger.info(`🚀 ReachInbox API Server running on http://localhost:${env.PORT}`);
    logger.info(`📊 Bull Board Live Queue Dashboard: http://localhost:${env.PORT}/admin/queues`);
  });
}

startServer().catch((err) => {
  logger.error(`❌ Server startup failed: ${err.message}`);
  process.exit(1);
});
