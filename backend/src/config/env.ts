import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/reachinbox?schema=public'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),

  ELASTICSEARCH_NODE: z.string().default('http://localhost:9200'),

  JWT_SECRET: z.string().default('super-secret-jwt-key-reachinbox-scheduler-assignment-2026'),

  GOOGLE_CLIENT_ID: z.string().default('mock-google-client-id'),
  GOOGLE_CLIENT_SECRET: z.string().default('mock-google-client-secret'),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:5000/api/auth/google/callback'),

  SLACK_CLIENT_ID: z.string().default('mock-slack-client-id'),
  SLACK_CLIENT_SECRET: z.string().default('mock-slack-client-secret'),
  SLACK_SIGNING_SECRET: z.string().default('mock-slack-signing-secret'),
  SLACK_REDIRECT_URI: z.string().default('http://localhost:5000/api/slack/callback'),

  ETHEREAL_USER: z.string().optional(),
  ETHEREAL_PASSWORD: z.string().optional(),

  WORKER_CONCURRENCY: z.coerce.number().default(5),
  MIN_DELAY_BETWEEN_EMAILS_MS: z.coerce.number().default(2000),
  MAX_EMAILS_PER_HOUR_PER_SENDER: z.coerce.number().default(200),

  FRONTEND_URL: z.string().default('http://localhost:5173'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);
