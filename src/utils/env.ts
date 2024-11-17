import winston from 'winston';
import * as dotenv from 'dotenv';
import * as process from 'process';
import * as fs from 'fs';

const { combine, timestamp, json } = winston.format;
dotenv.config();

const publicKeyPath = process.env.PUB_KEY_PATH;
const privateKeyPath = process.env.PRIV_KEY_PATH;

if (!publicKeyPath || !privateKeyPath)
  throw new Error(
    'public or private key path is not set in the environment variables.'
  );

export const env = {
  ROUTE_PREFIX: '/api/v1/',
  COOKIENAME: process.env.COOKIENAME || 'ERPCOOKIE',
  COOKIESECURE: process.env.NODE_ENV === 'production',
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || 'lax',
  FRONTEND_URL: process.env.FRONTEND_URL || '*',
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_PUB_KEY: fs.readFileSync(publicKeyPath, 'utf8'),
  JWT_PRIV_KEY: fs.readFileSync(privateKeyPath, 'utf8'),
  // https://github.com/winstonjs/winston
  LOGGER: winston.createLogger({
    level: 'http',
    format: combine(
      timestamp({
        format: 'YYYY-MM-DD hh:mm:ss.SSS A'
      }),
      json()
    ),
    transports: [
      new winston.transports.File({
        dirname: 'logs',
        filename: 'combined.json'
      })
    ]
  }),
  DB_CONFIG: {
    user: process.env.DB_USERNAME || 'erp',
    password: process.env.DB_PASSWORD || 'erp',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_DATABASE || 'erp_db'
  }
};
