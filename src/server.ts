import { env } from '@utils/env';
import { createApp } from './app';
import { Pool } from 'pg';
import { DevelopmentLogger, LoggerImpl } from '@utils/log';
import { DatabaseClient } from '@stores/db-client';
import { TransactionProvider } from '@stores/transaction';
import { initializeAdapters } from '@stores/adapters';
import { initializeServices } from '@services/services';

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

  const log = env.COOKIESECURE
    ? new LoggerImpl(env.LOGGER, 'America/Toronto')
    : new DevelopmentLogger('America/Toronto');
  const db = new DatabaseClient(pool);
  const tx = new TransactionProvider(log, pool);
  const adapters = initializeAdapters(log, db, tx);
  const services = initializeServices(log, adapters);
  return createApp(log, services);
};

init().listen(env.PORT, () =>
  console.log(`erp api listening on port ${env.PORT}`)
);
