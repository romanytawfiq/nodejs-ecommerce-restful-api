import express, { Express } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import hpp from 'hpp';

import { ENV } from '#src/config/env.js';
import { morganMiddleware } from '#src/middlewares/logger.js';
import { AppError, errorHandler } from '#src/middlewares/error-handler.js';
import healthcheckRoutes from '#src/modules/healthcheck/healthcheck.route.js';
import userRoutes from '#src/modules/user/user.route.js';
import categoryRoutes from '#src/modules/category/category.route.js';
import { responses } from './utils/response.js';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(hpp());

  app.use(
    cors({
      origin: ENV.CORS_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());

  app.use(morganMiddleware);

  app.get('/env', async (_req, res) => {
    return responses.success({ env: process.env }, res);
  });

  app.use('/api', healthcheckRoutes);
  app.use('/api', userRoutes);
  app.use('/api', categoryRoutes);

  app.use((_req, _res, next) => {
    next(new AppError('Route not found', 404));
  });

  app.use(errorHandler);

  return app;
};
