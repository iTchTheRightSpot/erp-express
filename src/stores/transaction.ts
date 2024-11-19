import { DatabaseTransactionClient } from './db-client';
import { Adapters, initializeAdapters } from './adapters';
import { ILogger } from '@utils/log';
import { Pool } from 'pg';

export enum TransactionIsolationLevel {
  READ_UNCOMMITED = 'BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED',
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
    isolation: TransactionIsolationLevel = TransactionIsolationLevel.READ_COMMITTED
  ): Promise<T> {
    const poolClient = await this.pool.connect();
    const client = new DatabaseTransactionClient(poolClient);
    this.logger.log(isolation);
    try {
      await client.exec(`${isolation}`);
      const result = await txFunc(initializeAdapters(this.logger, client));
      await client.exec('COMMIT');
      this.logger.log('TRANSACTION COMMITTED');
      return result;
    } catch (err) {
      await poolClient.query('ROLLBACK');
      this.logger.error(`TRANSACTION ROLLED BACK. ${err}`);
      throw err;
    } finally {
      poolClient.release();
    }
  }
}
