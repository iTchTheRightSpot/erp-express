import express, { Application, Router } from 'express';
import { env } from '@utils/env';
import { DevelopmentLogger, ILogger, LoggerImpl } from '@utils/log';
import { initializeServices, IServices } from '@services/services.interface';
import bodyParser from 'body-parser';
import cors from 'cors';
import * as path from 'path';
import cookieParser from 'cookie-parser';
import { expressjwt } from 'express-jwt';
import { initializeHandlers } from '@handlers/handlers.inteface';
import { Pool } from 'pg';
import { middlewareChain } from '@middlewares/chain.middleware';

export const createApp = (logger: ILogger, services: IServices) => {
  const app: Application = express();

  app.use(middlewareChain.log(logger));
  app.use(express.json());
  app.use(bodyParser.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(
    cors({
      origin: [env.FRONTEND_URL, '*'],
      credentials: true
    })
  );
  app.set('trust proxy', 1);
  app.use(cookieParser());

  app.use(
    expressjwt({
      secret: env.JWT_PUB_KEY,
      algorithms: ['RS256'],
      credentialsRequired: true,
      getToken: (req) => req.cookies[env.COOKIENAME]
    }).unless({
      path: [env.ROUTE_PREFIX, new RegExp(`${env.ROUTE_PREFIX}authentication/`)]
    })
  );

  // routes
  const router = Router();
  initializeHandlers(router, logger, services);

  app.use(env.ROUTE_PREFIX, router);

  app.use(middlewareChain.error(logger));

  return app;
};

const init = () => {
  let pool: Pool;
  try {
    pool = new Pool({
      user: env.DB_CONFIG.user,
      password: env.DB_CONFIG.password,
      host: env.DB_CONFIG.host,
      port: env.DB_CONFIG.port,
      database: env.DB_CONFIG.database,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  const log =
    env.NODE_ENV === 'production'
      ? new LoggerImpl(env.LOGGER)
      : new DevelopmentLogger();
  return createApp(log, initializeServices());
};

export default init;
