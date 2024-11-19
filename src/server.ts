import { env } from '@utils/env';
import { createApp } from './app';
import { Pool } from 'pg';
import { DevelopmentLogger, LoggerImpl } from '@utils/log';
import { DatabaseClient } from '@stores/db-client';
import { TransactionProvider } from '@stores/transaction';
import { initializeAdapters } from '@stores/adapters';
import { initializeServices } from '@services/services';

const init = async () => {
  const pool = new Pool({
    user: env.DB_CONFIG.user,
    password: env.DB_CONFIG.password,
    host: env.DB_CONFIG.host,
    port: env.DB_CONFIG.port,
    database: env.DB_CONFIG.database,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });

  const logger = env.COOKIESECURE
    ? new LoggerImpl(env.LOGGER, 'America/Toronto')
    : new DevelopmentLogger('America/Toronto');
  const db = new DatabaseClient(pool);
  const tx = new TransactionProvider(logger, pool);
  const adapters = initializeAdapters(logger, db, tx);
  const services = initializeServices(logger, adapters);

  process.on('unhandledRejection', (reason, p) => {
    setImmediate(async () => {
      try {
        await logger.critical(`unhandled promise rejection reason ${reason}`);
      } catch (e) {
        console.error('failed to notify ', e);
      }
    });

    console.error('unhandled promise rejection at:', p);
  });

  return createApp(logger, services);
};

init()
  .then((app) =>
    app.listen(env.PORT, () =>
      console.log(`erp api listening on port ${env.PORT}`)
    )
  )
  .catch((err) => console.log(err));
