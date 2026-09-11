import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { env } from './config/env';
import { emailQueue } from './queues/email.queue';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import senderRoutes from './routes/sender.routes';
import emailRoutes from './routes/email.routes';
import slackRoutes from './routes/slack.routes';
import searchRoutes from './routes/search.routes';

export const app = express();

// Configure CORS
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Setup Bull Board live Queue dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);
app.use('/api/search', searchRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'reachinbox-backend',
  });
});

// Centralized error handler
app.use(errorHandler);
