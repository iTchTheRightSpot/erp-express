import { DatabaseTransactionClient } from './db-client';
import { Adapters, initializeAdapters } from './adapters';
import { ILogger } from '@utils/log';
import { Pool } from 'pg';

export enum TransactionIsolationLevel {
  NO_ISOLATION = 'BEGIN',
  READ_COMMITTED = 'BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED',
  REPEATABLE_READ = 'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ',
  SERIALIZABLE = 'BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;'
}

export interface ITransactionProvider {
  /**
   * Executes the provided function within a database transaction.
   * If the function completes successfully, the transaction is committed;
   * if an error occurs, the transaction is rolled back.
   *
   * @param txFunc - A function that receives an instance of Adapters
   * and contains the operations to be executed in the transaction.
   * @param isolation
   * @returns A promise that resolves when the transaction is complete.
   */
  runInTransaction<T>(
    txFunc: (adapters: Adapters) => Promise<T>,
    isolation?: TransactionIsolationLevel
  ): Promise<T>;
}

export class TransactionProvider implements ITransactionProvider {
  constructor(
    private readonly logger: ILogger,
    private readonly pool: Pool
  ) {}

  async runInTransaction<T>(
    txFunc: (adapters: Adapters) => Promise<T>,
    isolation: TransactionIsolationLevel = TransactionIsolationLevel.NO_ISOLATION
  ): Promise<T> {
    const poolClient = await this.pool.connect();
    try {
      const client = new DatabaseTransactionClient(poolClient);
      await client.execContext(`${isolation}`);
      this.logger.log('transaction begun');
      const result = await txFunc(initializeAdapters(this.logger, client));
      await client.execContext('COMMIT');
      this.logger.log('transaction commited');
      return result;
    } catch (err) {
      await poolClient.query('ROLLBACK');
      this.logger.error(`transaction failed, rolling back. ${err}`);
      throw err;
    } finally {
      poolClient.release();
    }
  }
}
