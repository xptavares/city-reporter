import express from 'express';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/error-handler';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use('/api/health', healthRouter);

  app.use(errorHandler);
  return app;
}
