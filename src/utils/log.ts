import { LogEntry, Logger } from 'winston';
import moment from 'moment-timezone';
import { ServerException } from '@exceptions/server.exception';

export interface ILogger {
  timezone(): string;
  date(): Date;
  log(...args: any[]): void;
  error(...args: any[]): void;
  critical(...args: any[]): Promise<void>;
}

export class LoggerImpl implements ILogger {
  private readonly momentTimeZone: moment.Moment;

  constructor(
    private readonly logger: Logger,
    zone: string
  ) {
    if (!moment.tz.names().includes(zone)) {
      throw new ServerException(`invalid timezone: ${zone}`);
    }
    this.momentTimeZone = moment().tz(zone);
  }

  error(...args: any[]): void {
    const entry: LogEntry = {
      level: 'error',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    };
    this.logger.error(entry);
  }

  log(...args: any[]): void {
    const entry: LogEntry = {
      level: 'info',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    };
    this.logger.info(entry);
  }

  date(): Date {
    return this.momentTimeZone.toDate();
  }

  async critical(...args: any[]): Promise<void> {
    const entry: LogEntry = {
      level: 'error',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    };
    this.logger.error(entry);
  }

  timezone(): string {
    return this.momentTimeZone.tz()!;
  }
}

export class DevelopmentLogger implements ILogger {
  private readonly momentTimeZone: moment.Moment;

  constructor(zone?: string) {
    const z = zone || 'America/Toronto';
    if (!moment.tz.names().includes(z)) {
      throw new ServerException(`invalid timezone: ${z}`);
    }
    this.momentTimeZone = moment().tz(z);
  }

  date(): Date {
    return this.momentTimeZone.toDate();
  }

  error(...args: any[]): void {
    const entry: LogEntry = {
      level: 'error',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    };
    console.error(entry);
  }

  log(...args: any[]): void {
    const entry: LogEntry = {
      level: 'info',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    };
    console.log(entry);
  }

  async critical(...args: any[]): Promise<void> {
    const entry: LogEntry = {
      level: 'error',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    };
    console.error(entry);
  }

  timezone(): string {
    return this.momentTimeZone.tz()!;
  }
}
